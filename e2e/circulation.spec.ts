import { expect, test, Page, APIRequestContext } from '@playwright/test';
import { randomUUID } from 'node:crypto';

const password = 'QaLocalOnly!2026';
async function login(page: Page, email: string) {
  await page.goto('/auth/login'); await page.getByRole('textbox', { name: 'Correo electrónico', exact: true }).fill(email);
  await page.locator('input[name="password"]').fill(password); await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
  await expect(page).not.toHaveURL(/\/auth\//);
}
async function fixture(request: APIRequestContext) {
  const marker = await (await request.get('/__qa')).json(); expect(marker.databaseName).toMatch(/^booklibrary_ui_test_[a-f0-9]{32}$/);
  const policy = await (await request.get('/api/circulation/policy')).json();
  test.skip(policy.mode !== 'active', 'Run this journey against a fresh QaHost with Circulation__Mode=active.');
  const admin = await (await request.post('/api/auth/login', { data: { email: 'admin@booklibrary.invalid', password } })).json();
  const staff = { Authorization: `Bearer ${admin.token}` };
  async function reader() {
    const name = 'circ_' + randomUUID().replaceAll('-', '').slice(0, 12); const email = name + '@example.invalid';
    expect((await request.post('/api/admin/users', { headers: staff, data: { username: name, displayName: name, email, password, role: 'user' } })).ok()).toBeTruthy();
    const auth = await (await request.post('/api/auth/login', { data: { email, password } })).json();
    return { email, headers: { Authorization: `Bearer ${auth.token}` } };
  }
  const first = await reader(), second = await reader();
  return { ...first, second, staff, bookId: marker.books.find((b: any) => b.title === 'Último ejemplar').id };
}

test('recogida, recarga, dos pestañas, renovación, devolución y FIFO', async ({ page, request, browser, context }, info) => {
  const f = await fixture(request); await login(page, f.email); await page.goto(`/app/catalog/${f.bookId}`);
  await page.getByRole('button', { name: 'Reservar para recoger', exact: true }).click(); await page.getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Gestionar recogida' })).toBeVisible(); await page.reload();
  await expect(page.getByRole('link', { name: 'Gestionar recogida' })).toBeVisible();
  const other = await context.newPage(); await other.goto(`/app/catalog/${f.bookId}`); await expect(other.getByRole('link', { name: 'Gestionar recogida' })).toBeVisible(); await other.close();
  const staffContext = await browser.newContext(); const staffPage = await staffContext.newPage();
  await login(staffPage, 'admin@booklibrary.invalid'); await staffPage.goto('/admin/circulation');
  const pickup = staffPage.locator('article').filter({ has: staffPage.getByRole('heading', { name: 'Último ejemplar', exact: true }) }).first();
  await pickup.getByRole('button', { name: 'Confirmar entrega' }).click(); await staffPage.getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(staffPage.getByRole('status').filter({ hasText: 'Operación confirmada' })).toBeVisible();
  await page.goto('/app/my-library'); await page.getByRole('button', { name: 'Solicitar renovación' }).click(); await page.getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(page.locator('app-circulation-panel')).toContainText('Pendiente');
  await staffPage.reload(); await staffPage.getByRole('button', { name: 'Aprobar', exact: true }).click(); await staffPage.getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(staffPage.getByRole('status').filter({ hasText: 'Operación confirmada' })).toBeVisible();
  await page.reload(); await expect(page.locator('app-circulation-panel')).toContainText('Aprobada');
  expect((await request.post('/api/waitlist', { headers: f.second.headers, data: { bookId: f.bookId, idempotencyKey: randomUUID() } })).status()).toBe(201);
  const loans = await (await request.get('/api/loans/my', { headers: f.headers })).json(); const loan = loans.items.find((l: any) => l.bookId === f.bookId);
  expect((await request.put(`/api/loans/${loan.id}/return`, { headers: f.headers })).status()).toBe(403);
  expect((await request.put(`/api/loans/${loan.id}/return`, { headers: f.staff })).ok()).toBeTruthy();
  const secondPickups = await (await request.get('/api/pickup-reservations/my', { headers: f.second.headers })).json(); expect(secondPickups.items[0].status).toBe('ready');
  await page.goto('/app/my-library');
  for (const theme of ['light', 'dark']) {
    await page.evaluate(value => document.documentElement.setAttribute('data-theme', value), theme);
    for (const width of [360, 768, 1366]) {
      await page.setViewportSize({ width, height: 900 }); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBeTruthy();
      await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
      expect(await page.evaluate(async () => (await (window as any).axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } })).violations.map((v: any) => ({ id: v.id, nodes: v.nodes.map((n: any) => n.target) })))).toEqual([]);
      await page.screenshot({ path: info.outputPath(`circulation-${theme}-${width}.png`), fullPage: true });
    }
  }
  const p = secondPickups.items[0]; expect((await request.put(`/api/pickup-reservations/${p.id}/cancel`, { headers: f.second.headers, data: { expectedVersion: p.version } })).ok()).toBeTruthy();
  await staffContext.close();
});

test('espera, expiración recuperable y notificación sin préstamo ficticio', async ({ page, request }) => {
  const f = await fixture(request);
  const created = await request.post('/api/pickup-reservations', { headers: f.headers, data: { bookId: f.bookId, idempotencyKey: randomUUID() } }); expect(created.status()).toBe(201);
  const pickup = await created.json();
  await login(page, f.second.email); await page.goto(`/app/catalog/${f.bookId}`);
  await page.getByRole('button', { name: 'Entrar en lista de espera' }).click(); await page.getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Gestionar espera' })).toBeVisible(); await page.reload(); await expect(page.getByRole('link', { name: 'Gestionar espera' })).toBeVisible();
  expect((await request.post(`/__qa/circulation/expire/${pickup.id}`)).ok()).toBeTruthy();
  await page.reload(); await expect(page.getByRole('link', { name: 'Gestionar recogida' })).toBeVisible();
  const notices = await (await request.get('/api/notifications/my', { headers: f.second.headers })).json(); expect(notices.items.some((n: any) => n.type === 'pickup_ready')).toBeTruthy();
  const loans = await (await request.get('/api/loans/my', { headers: f.second.headers })).json(); expect(loans.items).toEqual([]);
});

test('panel de personal, teclado, modal y accesibilidad en ambos temas', async ({ page, request }, info) => {
  await fixture(request); await login(page, 'admin@booklibrary.invalid'); await page.goto('/admin/circulation');
  await expect(page.getByRole('heading', { name: 'Circulación', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Confirmar entrega' }).first()).toBeVisible();
  for (const theme of ['light', 'dark']) {
    await page.evaluate(value => document.documentElement.setAttribute('data-theme', value), theme);
    for (const width of [360, 768, 1366]) {
      await page.setViewportSize({ width, height: 900 }); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBeTruthy();
      await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
      expect(await page.evaluate(async () => (await (window as any).axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } })).violations.map((v: any) => ({ id: v.id, nodes: v.nodes.map((n: any) => n.target) })))).toEqual([]);
      await page.screenshot({ path: info.outputPath(`staff-circulation-${theme}-${width}.png`), fullPage: true });
    }
  }
  const trigger = page.getByRole('button', { name: 'Confirmar entrega' }).first(); await trigger.click();
  const dialog = page.getByRole('dialog'); await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Volver' })).toBeFocused();
  await page.keyboard.press('Escape'); await expect(dialog).toHaveCount(0); await expect(trigger).toBeFocused();
  await page.route('**/api/pickup-reservations?*', route => route.fulfill({ status: 503, body: '{}' }));
  await page.getByRole('button', { name: 'Filtrar', exact: true }).click(); await expect(page.getByRole('alert')).toContainText('No pudimos cargar');
  await page.unroute('**/api/pickup-reservations?*'); await page.getByRole('button', { name: 'Reintentar', exact: true }).click(); await expect(page.getByRole('alert')).toHaveCount(0);
});
