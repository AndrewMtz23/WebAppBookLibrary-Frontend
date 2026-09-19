import { expect, test, Page } from '@playwright/test';
const password = 'QaLocalOnly!2026';

test.beforeEach(async ({ request }) => {
  // Never run mutations against an ordinary development or production API.
  const response = await request.get('/__qa');
  expect(response.ok()).toBeTruthy();
  const fixture = await response.json();
  expect(fixture.fixture).toBe('booklibrary-phase5');
  expect(fixture.databaseName).toMatch(/^booklibrary_ui_test_[a-f0-9]{32}$/);
});

async function login(page: Page, role: string) {
  await page.goto('/auth/login');
  await page.getByRole('textbox', { name: 'Nombre de usuario', exact: true }).fill(`qa_${role}`);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole('button', { name: 'Iniciar sesión', exact: false }).click();
  await expect(page).not.toHaveURL(/\/auth\//);
  await expect(page.locator('h1')).toBeVisible();
}

async function accessibility(page: Page) {
  await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
  const violations = await page.evaluate(async () => {
    const results = await (window as any).axe.run(document, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] },
    });
    return results.violations.map((v: any) => ({ id: v.id, impact: v.impact, nodes: v.nodes.map((n: any) => ({ target: n.target, reason: n.failureSummary })) }));
  });
  expect(violations).toEqual([]);
}

for (const role of ['user', 'librarian', 'admin']) {
  test(`${role}: navegación, accesibilidad y cuatro tamaños`, async ({ page }, testInfo) => {
    test.setTimeout(180_000);
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await login(page, role);
    const routes = role === 'user'
      ? ['/app/discover', '/app/catalog', '/app/my-library', '/app/favorites', '/app/profile']
      : role === 'librarian'
        ? ['/librarian/dashboard', '/librarian/books', '/librarian/loans']
        : ['/admin/dashboard', '/admin/users', '/admin/books', '/admin/loans', '/admin/logs', '/admin/security'];
    for (const route of routes) {
      await page.goto(route);
      await expect(page.locator('h1')).toBeVisible();
      await page.waitForLoadState('networkidle');
      for (const [width, height] of [[360, 800], [768, 1024], [1366, 768], [1920, 1080]]) {
        await page.setViewportSize({ width, height });
        await expect(page.locator('h1')).toHaveCount(1);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), `${route} at ${width}: horizontal overflow`).toBeTruthy();
        await accessibility(page);
        await page.screenshot({ path: testInfo.outputPath(`${route.replaceAll('/', '-')}-${width}.png`), fullPage: true });
      }
    }
    expect(errors).toEqual([]);
  });
}

test('editar cuenta dos veces cierra modal, muestra toast y restaura foco', async ({ page }) => {
  await login(page, 'admin');
  await page.goto('/admin/users');
  for (const name of ['Admin de prueba actualizado', 'Prueba admin']) {
    const trigger = page.getByRole('button', { name: 'Editar usuario qa_admin', exact: true });
    await trigger.click();
    const dialog = page.getByRole('dialog', { name: 'Actualizar usuario' });
    await dialog.getByRole('textbox', { name: 'Nombre visible', exact: true }).fill(name);
    await dialog.getByRole('button', { name: 'Actualizar usuario', exact: false }).click();
    await expect(dialog).toBeHidden();
    await expect(page.locator('mat-snack-bar-container')).toContainText('actualizado');
    await expect(trigger).toBeFocused();
    await page.getByRole('button', { name: 'Cerrar', exact: true }).click();
  }
  await page.getByRole('button', { name: 'Editar usuario qa_admin', exact: true }).click();
  await page.getByRole('dialog').press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
});

test('fallo al guardar conserva modal, datos y mensaje accesible', async ({ page }) => {
  await login(page, 'admin');
  await page.goto('/admin/users');
  await page.getByRole('button', { name: 'Editar usuario qa_admin', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Actualizar usuario' });
  await dialog.getByRole('textbox', { name: 'Nombre visible', exact: true }).fill('Cambios sin guardar');
  await page.route('**/api/admin/users/*', route => route.request().method() === 'PUT'
    ? route.fulfill({ status: 503, contentType: 'application/problem+json', body: JSON.stringify({ title: 'Servicio temporalmente no disponible', status: 503 }) })
    : route.continue());
  await dialog.getByRole('button', { name: 'Actualizar usuario', exact: false }).click();
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('textbox', { name: 'Nombre visible', exact: true })).toHaveValue('Cambios sin guardar');
  await expect(dialog.getByRole('alert')).toBeVisible();
  await expect(page.locator('mat-snack-bar-container')).toBeVisible();
});

test('registro, login, reserva digital y apertura desde Mi biblioteca', async ({ page, request }) => {
  const username = `lector_${Date.now()}`;
  await page.goto('/auth/register');
  await page.locator('input[name="username"]').fill(username);
  await page.locator('input[name="email"]').fill(`${username}@example.invalid`);
  await page.locator('input[name="password"]').fill(password);
  await page.locator('input[name="confirmPassword"]').fill(password);
  await page.getByRole('button', { name: 'Crear cuenta', exact: false }).click();
  await expect(page).toHaveURL(/\/auth\/login/);
  await page.locator('input[name="username"]').fill(username);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole('button', { name: 'Iniciar sesión', exact: false }).click();
  await expect(page).toHaveURL(/\/app\/discover/);
  const fixture = await (await request.get('/__qa')).json();
  const digital = fixture.books.find((book: any) => book.title === 'Cuaderno de historias');
  await page.goto(`/app/catalog/${digital.id}`);
  await page.getByRole('button', { name: 'Reservar acceso digital' }).click();
  await expect(page.getByRole('button', { name: 'Abrir recurso' })).toBeVisible();
  await page.goto('/app/my-library');
  const card = page.locator('article').filter({ hasText: 'Cuaderno de historias' });
  await expect(card).toBeVisible();
  // Intercept only the external destination; real reservation and access use the QA API.
  await page.context().route('https://www.gutenberg.org/**', route => route.fulfill({ body: '<title>Recurso de prueba</title>' }));
  const popupPromise = page.waitForEvent('popup');
  await card.getByRole('button', { name: 'Abrir recurso' }).click();
  const popup = await popupPromise;
  await expect(popup).toHaveURL('https://www.gutenberg.org/ebooks/84');
  await popup.close();
});

test('sesión expirada conserva retorno permitido después de login', async ({ page }) => {
  await login(page, 'user');
  // Deliberately expire only this fictitious browser session.
  await page.evaluate(() => {
    const session = JSON.parse(localStorage.getItem('booklibrary_session')!);
    const parts = session.token.split('.');
    parts[1] = btoa(JSON.stringify({ exp: 1 })).replaceAll('=', '');
    session.token = parts.join('.');
    localStorage.setItem('booklibrary_session', JSON.stringify(session));
  });
  await page.goto('/app/favorites');
  await expect(page).toHaveURL(/\/auth\/login\?returnUrl=/);
  await page.locator('input[name="username"]').fill('qa_user');
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole('button', { name: 'Iniciar sesión', exact: false }).click();
  await expect(page).toHaveURL(/\/app\/favorites$/);
});
