import { expect, test, Page, APIRequestContext } from '@playwright/test';
import { randomUUID } from 'node:crypto';

test.use({ actionTimeout: 10000 });
const password = 'QaLocalOnly!2026';
async function fixture(request: APIRequestContext, role = 'user') {
  const marker = await (await request.get('/__qa')).json();
  expect(marker.databaseName).toMatch(/^booklibrary_ui_test_[a-f0-9]{32}$/);
  const admin = await (await request.post('/api/auth/login', { data: { email: 'admin@booklibrary.invalid', password } })).json();
  const adminHeaders = { Authorization: `Bearer ${admin.token}` };
  const name = 'reading_' + randomUUID().replaceAll('-', '').slice(0, 12);
  const email = name + '@example.invalid';
  expect((await request.post('/api/admin/users', { headers: adminHeaders, data: { username: name, displayName: 'Prueba de lectura', email, password, role } })).ok()).toBeTruthy();
  const auth = await (await request.post('/api/auth/login', { data: { email, password } })).json();
  const headers = { Authorization: `Bearer ${auth.token}` };
  const data = { title: 'Las historias que dejamos a medias: un cuaderno personal de viajes y lecturas ' + name, authors: ['Autora de prueba'], description: 'Un libro de prueba para verificar el seguimiento personal de lectura.', genres: ['Narrativa'], mediaType: 'digital', digitalResourceUrl: 'https://example.invalid/book', pageCount: 100, language: 'es' };
  const created = await request.post('/api/books', { headers: adminHeaders, data });
  expect(created.ok(), await created.text()).toBeTruthy();
  return { email, headers, adminHeaders, book: await created.json(), data };
}
async function login(page: Page, email: string) {
  await page.goto('/auth/login');
  await page.getByRole('textbox', { name: 'Correo electrónico', exact: true }).fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
  await expect(page).not.toHaveURL(/\/auth\//);
}
async function begin(page: Page, bookId: string, value = '37') {
  await page.goto('/app/catalog/' + bookId);
  await page.getByRole('button', { name: 'Mi lectura' }).click();
  await page.getByRole('combobox', { name: 'Estado', exact: true }).selectOption('reading');
  await page.getByLabel('Porcentaje leído').fill(value);
  await page.getByRole('button', { name: 'Guardar progreso', exact: true }).click();
  await expect(page.locator('app-reading-editor')).toBeHidden();
}

for (const role of ['user', 'librarian', 'admin']) test(`${role}: lectura persistida, perfil, banner y reinicio`, async ({ page, request }, info) => {
  const f = await fixture(request, role); await login(page, f.email);
  await begin(page, f.book.id);
  await page.goto('/app/reading'); await expect(page.locator('.reading-card')).toContainText('37 %');
  await page.reload(); await expect(page.locator('.reading-card')).toContainText('37 %');
  await page.goto('/app/profile'); await expect(page.locator('.latest-reading')).toContainText('37 % leído');
  await page.goto('/app/discover'); await expect(page.locator('app-discover-app-banner')).toContainText('37%');
  if (role === 'user') await page.locator('app-discover-app-banner').screenshot({ path: info.outputPath('reading-banner.png') });
  await page.goto('/app/reading'); await page.getByRole('button', { name: 'Actualizar lectura' }).click();
  await page.getByRole('combobox', { name: 'Estado', exact: true }).selectOption('want_to_read');
  await page.getByLabel('Confirmo reiniciar').check();
  await page.getByRole('button', { name: 'Guardar progreso', exact: true }).click();
  await page.getByRole('tab', { name: /Quiero leer/ }).click(); await expect(page.locator('.reading-card')).toContainText('0 %');
  const list = await (await request.get('/api/reading/my', { headers: f.headers })).json();
  expect(list.items[0].startedAt).toBeNull(); expect(list.items[0].lastProgressAt).toBeNull();
});

test('dos dispositivos conservan el borrador en conflicto y otra cuenta no ve la lectura', async ({ page, browser, request }, info) => {
  const f = await fixture(request); await login(page, f.email); await begin(page, f.book.id);
  const otherContext = await browser.newContext({ baseURL: 'http://localhost:4284' }); const other = await otherContext.newPage();
  try {
    await login(other, f.email);
    for (const p of [page, other]) { await p.goto('/app/reading'); await p.getByRole('button', { name: 'Actualizar lectura' }).click(); }
    await page.getByLabel('Porcentaje leído').fill('50'); await page.getByRole('button', { name: 'Guardar progreso', exact: true }).click();
    await expect(page.locator('.reading-card')).toContainText('50 %');
    await other.getByLabel('Porcentaje leído').fill('70'); await other.getByRole('button', { name: 'Guardar progreso', exact: true }).click();
    await expect(other.getByRole('alert')).toContainText('otro dispositivo'); await expect(other.getByLabel('Porcentaje leído')).toHaveValue('70');
    await expect(other.locator('[data-reading-error]')).toBeFocused();
    await other.screenshot({ path: info.outputPath('reading-conflict.png'), fullPage: true });
    await other.getByRole('button', { name: 'Recargar y descartar borrador' }).click(); await expect(other.locator('.reading-card')).toContainText('50 %');
    const stranger = await fixture(request); await login(other, stranger.email); await other.goto('/app/reading');
    await expect(other.locator('.reading-card')).toHaveCount(0);
    expect((await (await request.get('/api/reading/my', { headers: stranger.headers })).json()).items).toEqual([]);
  } finally { await otherContext.close(); }
});

test('páginas: reconciliación explícita, favoritos y préstamos independientes', async ({ page, request }) => {
  const f = await fixture(request); await login(page, f.email);
  expect((await request.post('/api/favorites/' + f.book.id, { headers: f.headers })).ok()).toBeTruthy();
  expect((await request.post('/api/loans', { headers: f.headers, data: { bookId: f.book.id } })).ok()).toBeTruthy();
  const loansResponse = await request.get('/api/loans/my', { headers: f.headers }); expect(loansResponse.ok()).toBeTruthy();
  const loansBefore = await loansResponse.text();
  await page.goto('/app/catalog/' + f.book.id); await page.getByRole('button', { name: 'Mi lectura' }).click();
  await page.getByRole('combobox', { name: 'Estado', exact: true }).selectOption('reading'); await page.getByRole('combobox', { name: 'Registrar por', exact: true }).selectOption('page');
  await page.getByRole('spinbutton', { name: 'Página actual', exact: true }).fill('40'); await page.getByRole('button', { name: 'Guardar progreso', exact: true }).click();
  await expect(page.locator('app-reading-editor')).toBeHidden();
  expect((await request.put('/api/books/' + f.book.id, { headers: f.adminHeaders, data: { ...f.data, pageCount: 20 } })).ok()).toBeTruthy();
  await page.goto('/app/reading'); await page.getByRole('button', { name: 'Actualizar lectura' }).click();
  await expect(page.locator('.notice')).toContainText('conserva 100');
  await page.getByLabel('Usar el nuevo total').check(); await page.getByRole('button', { name: 'Guardar progreso', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('dentro del total');
  await page.getByRole('spinbutton', { name: 'Página actual', exact: true }).fill('10'); await page.getByRole('button', { name: 'Guardar progreso', exact: true }).click();
  await expect(page.locator('.reading-card')).toContainText('50 %');
  await page.getByRole('button', { name: 'Actualizar lectura' }).click(); await page.getByRole('button', { name: 'Quitar seguimiento', exact: true }).click();
  await page.getByRole('button', { name: 'Sí, quitar seguimiento' }).click(); await expect(page.locator('.reading-card')).toHaveCount(0);
  expect(await (await request.get('/api/loans/my', { headers: f.headers })).text()).toBe(loansBefore);
  expect((await (await request.get('/api/favorites', { headers: f.headers })).json()).totalItems).toBe(1);
});

test('invitado recibe acceso a login y un fallo de guardado conserva el borrador', async ({ page, request }) => {
  const f = await fixture(request);
  await page.goto('/app/catalog/' + f.book.id); await page.getByRole('button', { name: 'Mi lectura' }).click();
  await expect(page.getByRole('dialog')).toContainText('organizar tus lecturas');
  await page.getByRole('button', { name: 'Seguir explorando' }).click();
  await page.goto('/app/reading'); await expect(page).toHaveURL(/auth\/login/);
  await login(page, f.email); await begin(page, f.book.id);
  await page.goto('/app/reading'); await page.getByRole('button', { name: 'Actualizar lectura' }).click();
  await page.route('**/api/reading/my/books/*', route => route.request().method() === 'PUT' ? route.fulfill({ status: 503, contentType: 'application/problem+json', body: '{}' }) : route.continue());
  await page.getByRole('spinbutton', { name: 'Porcentaje leído' }).fill('60'); await page.getByRole('button', { name: 'Guardar progreso', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('No pudimos confirmar');
  await expect(page.getByRole('spinbutton', { name: 'Porcentaje leído' })).toHaveValue('60');
  await expect(page.locator('.reading-card')).toContainText('37 %');
});

test('respuesta perdida después del commit: conserva borrador y recupera el avance guardado', async ({ page, request }) => {
  const f = await fixture(request); await login(page, f.email); await begin(page, f.book.id);
  await page.goto('/app/reading'); await page.getByRole('button', { name: 'Actualizar lectura' }).click();
  let writes = 0;
  await page.route('**/api/reading/my/books/*', async route => {
    if (route.request().method() !== 'PUT') return route.continue();
    writes++; const response = await route.fetch(); expect(response.ok()).toBeTruthy(); await route.abort('connectionreset');
  });
  await page.getByRole('spinbutton', { name: 'Porcentaje leído' }).fill('60');
  await page.getByRole('button', { name: 'Guardar progreso', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('puede haberse guardado');
  await expect(page.getByRole('spinbutton', { name: 'Porcentaje leído' })).toHaveValue('60');
  await expect(page.getByRole('button', { name: 'Guardar progreso', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Actualizar lectura' }).click();
  await expect(page.getByRole('button', { name: 'Guardar progreso', exact: true })).toBeDisabled();
  await expect(page.locator('.reading-card')).toContainText('37 %');
  await page.getByRole('button', { name: 'Recargar y descartar borrador' }).click();
  await expect(page.locator('.reading-card')).toContainText('60 %'); expect(writes).toBe(1);
});

test('dos pestañas comparten logout y cambio de cuenta sin aceptar una lectura pendiente anterior', async ({ page, context, request }) => {
  const f = await fixture(request); const stranger = await fixture(request);
  await login(page, f.email); await begin(page, f.book.id);
  const other = await context.newPage();
  await other.goto('/app/reading'); await expect(other.locator('.reading-card')).toContainText('37 %');
  let release!: () => void; const gate = new Promise<void>(resolve => release = resolve); let captured = false;
  await other.route('**/api/reading/my?*', async route => {
    const response = await route.fetch(); captured = true; await gate;
    await route.fulfill({ response }).catch(() => {});
  }, { times: 1 });
  await other.reload(); await expect.poll(() => captured).toBeTruthy();
  await page.locator('.account-menu__trigger').click();
  await page.getByRole('menuitem', { name: 'Cerrar sesión' }).click();
  await page.getByRole('button', { name: 'Sí, cerrar sesión' }).click();
  await expect(other.locator('.reading-card')).toHaveCount(0);
  await login(page, stranger.email); release();
  await other.goto('/app/reading'); await expect(other.locator('.reading-card')).toHaveCount(0);
  await expect(other.getByRole('heading', { name: 'Tu próxima historia te espera' })).toBeVisible();
  expect((await (await request.get('/api/reading/my', { headers: stranger.headers })).json()).items).toEqual([]);
});

for (const theme of ['light', 'dark']) test(`lectura responsive, teclado y accesibilidad: ${theme}`, async ({ page, request }, info) => {
  test.setTimeout(120_000);
  const f = await fixture(request); await login(page, f.email); await begin(page, f.book.id);
  await page.goto('/app/reading'); await page.getByRole('button', { name: 'Actualizar lectura' }).click();
  await page.evaluate(t => document.documentElement.setAttribute('data-theme', t), theme);
  for (const width of [360, 768, 1366, 1920]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBeTruthy();
    await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
    const violations = await page.evaluate(async () => (await (window as any).axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } })).violations.map((v: any) => ({ id: v.id, nodes: v.nodes.map((n: any) => n.target) })));
    expect(violations).toEqual([]);
    await page.screenshot({ path: info.outputPath(`reading-${theme}-${width}.png`), fullPage: true });
  }
  await page.getByRole('button', { name: 'Cerrar editor' }).click(); await expect(page.getByRole('button', { name: 'Actualizar lectura' })).toBeFocused();
  const tab = page.getByRole('tab', { name: /Leyendo/ }); await tab.focus(); await page.keyboard.press('ArrowLeft');
  await expect(page.getByRole('tab', { name: /Quiero leer/ })).toHaveAttribute('aria-selected', 'true');
});
