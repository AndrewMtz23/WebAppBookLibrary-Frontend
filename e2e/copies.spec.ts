import { expect, test } from '@playwright/test';
import { randomUUID } from 'node:crypto';

test('unit inventory supports inspection, pickup, damaged return, recovery and retirement', async ({ page, request, browser }, info) => {
  test.setTimeout(150000);
  const qa = await (await request.get('/__qa')).json(); expect(qa.databaseName).toMatch(/^booklibrary_ui_test_/);
  const password = 'QaLocalOnly!2026';
  const auth = await (await request.post('/api/auth/login', { data: { email: 'admin@booklibrary.invalid', password } })).json();
  const admin = { Authorization: `Bearer ${auth.token}` }; const bookId = qa.books[0].id;
  const book = await (await request.get(`/api/books/${bookId}`, { headers: admin })).json(); expect(book.inventoryMode).toBe('unit');
  const units = await (await request.get(`/api/books/${bookId}/copies`, { headers: admin })).json();
  for (const unit of units.items) {
    if (unit.status === 'available' || unit.status === 'held') {
      expect((await request.put(`/api/copies/${unit.id}/status`, { headers: admin, data: {
        status: unit.status === 'held' ? 'lost' : 'maintenance', reason: 'Isolated QA fixture preparation',
        expectedVersion: unit.version, idempotencyKey: randomUUID()
      } })).ok()).toBeTruthy();
    }
  }
  const refreshed = await (await request.get(`/api/books/${bookId}/copies`, { headers: admin })).json();
  const copy = refreshed.items.find((c: any) => c.status === 'maintenance'); expect(copy).toBeTruthy();
  const name = 'copy_' + randomUUID().replaceAll('-', '').slice(0, 12); const email = name + '@example.invalid';
  expect((await request.post('/api/admin/users', { headers: admin, data: { username: name, displayName: 'Lector de ejemplares', email, password, role: 'user' } })).ok()).toBeTruthy();
  const readerLogin = await (await request.post('/api/auth/login', { data: { email, password } })).json(); const reader = { Authorization: `Bearer ${readerLogin.token}` };
  expect((await request.get(`/api/copies/${copy.id}`, { headers: reader })).status()).toBe(403);
  await page.goto('/auth/login'); await page.getByRole('textbox', { name: 'Correo electrónico', exact: true }).fill('admin@booklibrary.invalid'); await page.locator('input[name="password"]').fill(password); await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click(); await expect(page).not.toHaveURL(/\/auth\//);
  await page.goto(`/librarian/copies/${copy.id}`);
  await expect(page.locator('.copy-hero .state')).toHaveText('Mantenimiento');
  await page.getByLabel('Condición observada').selectOption('good'); await page.getByLabel('Ubicación', { exact: true }).fill('Estante A-1'); await page.getByRole('button', { name: 'Confirmar inspección', exact: true }).click();
  await expect(page.locator('.copy-hero .state')).toHaveText('Disponible');
  const reservation = await request.post('/api/pickup-reservations', { headers: reader, data: { bookId, idempotencyKey: randomUUID() } }); expect(reservation.status()).toBe(201);
  const pickup = await reservation.json(); expect(pickup.copyId).toBe(copy.id);
  await page.reload(); await expect(page.locator('.copy-hero .state')).toHaveText('Retenido');
  await page.getByLabel('Código del ejemplar que tienes delante').fill(copy.inventoryCode);
  await page.getByRole('button', { name: 'Confirmar entrega', exact: true }).click(); await expect(page.locator('.copy-hero .state')).toHaveText('Prestado');
  await page.getByLabel('Condición observada').selectOption('damaged'); await page.getByLabel('Código del ejemplar que tienes delante').fill(copy.inventoryCode);
  await page.getByRole('button', { name: 'Confirmar devolución', exact: true }).click(); await expect(page.locator('.copy-hero .state')).toHaveText('Mantenimiento');
  let summary = await (await request.get(`/api/books/${bookId}`, { headers: admin })).json(); expect(summary.availableCopies).toBe(0);
  await page.getByLabel('Condición observada').selectOption('good'); await page.getByRole('button', { name: 'Confirmar inspección', exact: true }).click(); await expect(page.locator('.copy-hero .state')).toHaveText('Disponible');
  await page.getByLabel('Acción', { exact: true }).selectOption('lost'); await page.getByLabel('Motivo', { exact: true }).fill('No se encontró al revisar el estante'); await page.getByRole('button', { name: 'Confirmar cambio', exact: true }).click(); await expect(page.locator('.copy-hero .state')).toHaveText('Perdido');
  await page.getByLabel('Acción', { exact: true }).selectOption('maintenance'); await page.getByLabel('Motivo', { exact: true }).fill('Localizado en otra mesa'); await page.getByRole('button', { name: 'Confirmar cambio', exact: true }).click(); await expect(page.locator('.copy-hero')).toContainText('Pendiente de inspección');
  await page.getByLabel('Condición observada').selectOption('worn'); await page.getByRole('button', { name: 'Confirmar inspección', exact: true }).click(); await expect(page.locator('.copy-hero .state')).toHaveText('Disponible');
  for (const theme of ['light', 'dark']) {
    await page.evaluate(t => document.documentElement.setAttribute('data-theme', t), theme);
    for (const width of [360, 1366]) {
      await page.setViewportSize({ width, height: 900 }); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBeTruthy();
      await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
      expect(await page.evaluate(async () => (await (window as any).axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } })).violations.map((v: any) => ({id:v.id,nodes:v.nodes.map((n:any)=>n.target)})))).toEqual([]);
      await page.screenshot({ path: info.outputPath(`copies-${theme}-${width}.png`), fullPage: true });
    }
  }
  await expect(page.getByRole('button', { name: 'Imprimir etiqueta' })).toBeEnabled();
  const before = await (await request.get(`/api/copies/${copy.id}`, { headers: admin })).json(); await page.reload();
  expect((await (await request.get(`/api/copies/${copy.id}`, { headers: admin })).json()).version).toBe(before.version);
  await page.getByLabel('Acción', { exact: true }).selectOption('retired'); await page.getByLabel('Motivo', { exact: true }).fill('Baja autorizada de prueba'); await page.getByRole('button', { name: 'Confirmar cambio', exact: true }).click(); await expect(page.locator('.copy-hero .state')).toHaveText('Dado de baja');
  summary = await (await request.get(`/api/books/${bookId}`, { headers: admin })).json(); expect(summary.totalCopies).toBe(book.totalCopies - 1);
  await page.goto(`/librarian/copies?bookId=${bookId}`); await page.getByText('Registrar un ejemplar', { exact: true }).click();
  const code = 'QA-' + randomUUID().slice(0, 8).toUpperCase(); await page.getByLabel('Código de inventario').fill(code); await page.getByRole('button', { name: 'Registrar ejemplar', exact: true }).click(); await expect(page.locator('.copy-hero')).toContainText(code);
  await page.goto('/librarian/copies'); await page.getByLabel('Código o enlace QR').fill(code); await page.getByRole('button', { name: 'Abrir ejemplar', exact: true }).click(); await expect(page.locator('.copy-hero')).toContainText(code);
  const guestContext = await browser.newContext(); const guest = await guestContext.newPage(); await guest.goto(`/librarian/copies/${copy.id}`); await expect(guest).toHaveURL(/\/auth\/login/); await guestContext.close();
});
