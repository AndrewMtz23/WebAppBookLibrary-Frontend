import { expect, test, Page, APIRequestContext } from '@playwright/test';
import { randomUUID } from 'node:crypto';

const password = 'QaLocalOnly!2026';
async function fixture(request: APIRequestContext) {
  const marker = await (await request.get('/__qa')).json();
  expect(marker.databaseName).toMatch(/^booklibrary_ui_test_[a-f0-9]{32}$/);
  const admin = await (await request.post('/api/auth/login', { data: { email: 'admin@booklibrary.invalid', password } })).json();
  const name = 'notice_' + randomUUID().replaceAll('-', '').slice(0, 10); const email = name + '@example.invalid';
  expect((await request.post('/api/admin/users', { headers: { Authorization: `Bearer ${admin.token}` }, data: { username: name, displayName: 'Lector de avisos', email, password, role: 'user' } })).ok()).toBeTruthy();
  const auth = await (await request.post('/api/auth/login', { data: { email, password } })).json();
  return { email, headers: { Authorization: `Bearer ${auth.token}` }, bookId: marker.books.find((b: any) => b.title === 'Cuaderno de historias').id };
}
async function login(page: Page, email: string) {
  await page.goto('/auth/login'); await page.getByRole('textbox', { name: 'Correo electrónico', exact: true }).fill(email);
  await page.locator('input[name="password"]').fill(password); await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
  await expect(page).not.toHaveURL(/\/auth\//);
}

test('centro persistente, paginación, frontera de lectura y dos pestañas', async ({ page, request, context }) => {
  const f = await fixture(request);
  for (let i = 0; i < 11; i++) {
    const created = await request.post('/api/loans', { headers: f.headers, data: { bookId: f.bookId } });
    expect(created.status()).toBe(201);
    const loan = (await created.json()).data;
    expect((await request.put(`/api/loans/${loan.id}/cancel`, { headers: f.headers })).ok()).toBeTruthy();
  }
  await login(page, f.email); await page.goto('/app/notifications');
  await expect(page.locator('.unread-summary strong')).toHaveText('22');
  await expect(page.locator('.notice')).toHaveCount(20);
  await page.getByRole('button', { name: 'Cargar más avisos' }).click(); await expect(page.locator('.notice')).toHaveCount(22);
  expect((await request.post('/api/loans', { headers: f.headers, data: { bookId: f.bookId } })).status()).toBe(201);
  await page.getByRole('button', { name: 'Marcar todas como leídas' }).click();
  await expect(page.locator('.unread-summary strong')).toHaveText('1');
  await page.getByRole('button', { name: 'Sin leer', exact: true }).click(); await expect(page.locator('.notice')).toHaveCount(1);
  const other = await context.newPage(); await other.goto('/app/notifications'); await expect(other.locator('.unread-summary strong')).toHaveText('1');
  await page.getByRole('button', { name: 'Marcar como leída: Reserva confirmada' }).click(); await expect(page.locator('.empty')).toContainText('Estás al día');
  await other.getByRole('button', { name: 'Actualizar notificaciones' }).click(); await expect(other.locator('.unread-summary strong')).toHaveText('0'); await other.close();
  await expect(page.getByRole('checkbox', { name: /También por correo/ })).toBeDisabled();
  await page.getByRole('checkbox', { name: /Recordatorios/ }).uncheck(); await page.getByRole('button', { name: 'Guardar preferencias' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Preferencias guardadas' })).toBeVisible();
  await page.reload(); await expect(page.getByRole('checkbox', { name: /Recordatorios/ })).not.toBeChecked();
});

test('avisos accesibles, tema claro y oscuro, móvil y escritorio, error recuperable', async ({ page, request }, info) => {
  const f = await fixture(request);
  expect((await request.post('/api/loans', { headers: f.headers, data: { bookId: f.bookId } })).status()).toBe(201);
  await login(page, f.email); await page.goto('/app/notifications'); await expect(page.locator('.notice')).toHaveCount(1);
  for (const theme of ['light', 'dark']) {
    await page.evaluate(value => { document.documentElement.setAttribute('data-theme', value); localStorage.setItem('booklibrary_theme', value); }, theme);
    for (const width of [360, 768, 1366]) {
      await page.setViewportSize({ width, height: 900 });
      await expect(page.getByRole('link', { name: /^Notificaciones,/ }).filter({ visible: true })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBeTruthy();
      await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
      const violations = await page.evaluate(async () => (await (window as any).axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] } })).violations.map((v: any) => ({ id: v.id, nodes: v.nodes.map((n: any) => ({ target: n.target, reason: n.failureSummary })) })));
      expect(violations).toEqual([]);
      await page.screenshot({ path: info.outputPath(`notifications-${theme}-${width}.png`), fullPage: true });
    }
  }
  await page.route('**/api/notifications/my?*', route => route.fulfill({ status: 503, body: '{}' }));
  await page.getByRole('button', { name: 'Actualizar notificaciones' }).click(); await expect(page.getByRole('alert')).toContainText('No pudimos cargar');
  await page.unroute('**/api/notifications/my?*'); await page.getByRole('button', { name: 'Reintentar', exact: true }).click(); await expect(page.getByRole('alert')).toHaveCount(0);
  await page.getByRole('link', { name: 'Ver libro' }).click(); await expect(page).toHaveURL(new RegExp(f.bookId));
});
