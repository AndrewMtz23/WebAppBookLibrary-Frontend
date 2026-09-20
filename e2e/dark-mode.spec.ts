import { expect, test, Page } from '@playwright/test';

async function inspect(page: Page, label: string, issues: unknown[]) {
  await page.waitForLoadState('networkidle');
  await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
  const violations = await page.evaluate(async () => (await (window as any).axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } })).violations.map((v: any) => ({ id: v.id, nodes: v.nodes.map((n: any) => ({ target: n.target, reason: n.failureSummary })) })));
  if (violations.length) issues.push({ label, violations });
}
for (const role of ['admin', 'librarian', 'user', 'guest']) {
  test(`${role}: dark mode contrast across modules and dialogs`, async ({ page, request }, info) => {
    test.setTimeout(180_000);
    const fixture = await (await request.get('/__qa')).json();
    expect(fixture.fixture).toBe('booklibrary-phase5');
    expect(fixture.databaseName).toMatch(/^booklibrary_ui_test_[a-f0-9]{32}$/);
    if (role === 'admin' || role === 'librarian') {
      const login = await request.post('/api/auth/login', { data: { username: 'qa_user', password: 'QaLocalOnly!2026' } });
      expect(login.ok()).toBeTruthy();
      const auth = await login.json();
      const reserved = await request.post('/api/loans', { headers: { Authorization: `Bearer ${auth.token}` }, data: { bookId: fixture.books[0].id } });
      expect([201, 409]).toContain(reserved.status());
    }
    await page.addInitScript(() => localStorage.setItem('booklibrary_theme', 'dark'));
    await page.goto('/auth/login');
    if (role !== 'guest') {
      await page.getByRole('textbox', { name: 'Nombre de usuario', exact: true }).fill(`qa_${role}`);
      await page.locator('input[name="password"]').fill('QaLocalOnly!2026');
      await page.getByRole('button', { name: 'Iniciar sesión', exact: false }).click();
      await expect(page).not.toHaveURL(/\/auth\//);
    }
    const routes = role === 'admin' ? ['/admin/dashboard', '/admin/users', '/admin/books', '/admin/loans', '/admin/logs', '/admin/security']
      : role === 'librarian' ? ['/librarian/dashboard', '/librarian/books', '/librarian/loans']
      : role === 'user' ? ['/app/discover', '/app/catalog', `/app/catalog/${fixture.books[0].id}`, '/app/my-library', '/app/favorites', '/app/profile']
      : ['/auth/login', '/auth/register', '/privacy', '/legal'];
    const issues: unknown[] = [];
    for (const route of routes) {
      await page.goto(route);
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
      await inspect(page, route, issues);
      await page.screenshot({ path: info.outputPath(`${route.replaceAll('/', '-')}.png`), fullPage: true });
      if (route === '/admin/users') {
        await page.getByRole('button', { name: 'Agregar usuario', exact: true }).click();
        await inspect(page, 'create-user dialog', issues);
        await page.getByRole('dialog').getByRole('button', { name: 'Cancelar', exact: true }).click();
        await page.getByRole('button', { name: 'Editar usuario qa_admin', exact: true }).first().click();
        await inspect(page, 'edit-user dialog', issues);
        await page.getByRole('button', { name: 'Cerrar detalle', exact: true }).click();
      }
      if (route.endsWith('/books')) {
        await page.getByRole('button', { name: 'Crear libro', exact: true }).click();
        await inspect(page, `${role} book editor`, issues);
      }
      if (route === '/admin/logs') {
        await page.getByRole('button', { name: 'Ver detalle', exact: true }).first().click();
        await inspect(page, 'audit detail modal', issues);
      }
      if (route.endsWith('/loans')) {
        await page.locator('table button[data-detail]').first().click();
        await inspect(page, `${role} loan detail modal`, issues);
      }
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(routes[0]);
    await inspect(page, `${role} mobile`, issues);
    await page.screenshot({ path: info.outputPath('dark-mobile.png'), fullPage: true });
    expect(issues).toEqual([]);
  });
}
