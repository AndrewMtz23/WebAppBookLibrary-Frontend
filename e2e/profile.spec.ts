import { expect, test } from '@playwright/test';

test.beforeEach(async ({ request }) => {
  const marker = await request.get('/__qa');
  expect(marker.ok()).toBeTruthy();
  const fixture = await marker.json();
  expect(fixture.fixture).toBe('booklibrary-phase5');
  expect(fixture.databaseName).toMatch(/^booklibrary_ui_test_[a-f0-9]{32}$/);
});

for (const role of ['user', 'librarian', 'admin']) {
  test(`${role}: editar mi perfil, cancelar, error y persistencia`, async ({ page }, info) => {
    test.setTimeout(120_000);
    await page.route('https://images.example.test/profile.svg', route => route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="royalblue"/></svg>' }));
    await page.goto('/auth/login');
    await page.getByRole('textbox', { name: 'Nombre de usuario', exact: true }).fill(`qa_${role}`);
    await page.locator('input[name="password"]').fill('QaLocalOnly!2026');
    await page.getByRole('button', { name: 'Iniciar sesión', exact: false }).click();
    await expect(page).not.toHaveURL(/\/auth\//);
    await page.goto('/app/profile');
    const name = page.getByLabel('Nombre visible', { exact: true });
    await expect(name).toBeVisible();
    const original = await name.inputValue();
    await name.fill('Descartar');
    await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
    await expect(name).toHaveValue(original);
    await name.fill(`Mi perfil ${role}`);
    await page.locator('#profile-avatar').fill('https://images.example.test/profile.svg');
    await page.getByLabel('Correo electrónico', { exact: true }).fill(`profile_${role}@example.test`);
    await page.getByRole('button', { name: 'Guardar cambios', exact: true }).click();
    await expect(page.locator('mat-snack-bar-container')).toContainText('Perfil actualizado.');
    await expect(page.locator('#identity-name')).toHaveText(`Mi perfil ${role}`);
    await expect(page.locator('.reader-navbar__account')).toContainText(`Mi perfil ${role}`);
    await page.reload();
    await expect(name).toHaveValue(`Mi perfil ${role}`);
    await expect(page.locator('.identity app-avatar img')).toHaveAttribute('src', 'https://images.example.test/profile.svg');
    await expect(page.getByRole('region', { name: 'Resumen de actividad' })).toHaveCount(role === 'user' ? 1 : 0);
    if (role !== 'user') await expect(page.getByRole('link', { name: 'Ir a mi panel' })).toHaveAttribute('href', `/${role}/dashboard`);
    await page.route('**/api/profile/me', async route => {
      if (route.request().method() === 'PUT') await route.fulfill({ status: 503, contentType: 'application/problem+json', body: '{}' });
      else await route.continue();
    });
    await name.fill('Conservar borrador');
    await page.getByRole('button', { name: 'Guardar cambios', exact: true }).click();
    await expect(page.locator('.save-error')).toBeVisible();
    await expect(name).toHaveValue('Conservar borrador');
    await page.locator('mat-snack-bar-container').getByRole('button', { name: 'Cerrar', exact: true }).click();
    await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
    await page.unroute('**/api/profile/me');
    for (const theme of ['light', 'dark']) {
      await page.evaluate(value => document.documentElement.setAttribute('data-theme', value), theme);
      for (const width of [360, 1366]) {
        await page.setViewportSize({ width, height: 900 });
        await name.fill(`Mi perfil ${role} editando`);
        await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
        const violations = await page.evaluate(async () => (await (window as any).axe.run('.profile-page', { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] } })).violations.map((v: any) => ({ id: v.id, nodes: v.nodes.map((n: any) => ({ target: n.target, reason: n.failureSummary })) })));
        expect(violations).toEqual([]);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBeTruthy();
        await name.blur();
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.screenshot({ path: info.outputPath(`profile-${theme}-${width}.png`), fullPage: true });
      }
    }
  });
}
