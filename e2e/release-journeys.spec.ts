import { expect, test, Page, APIRequestContext } from '@playwright/test';
import { randomUUID } from 'node:crypto';

const password = 'QaLocalOnly!2026';
const unique = () => randomUUID().replaceAll('-', '').slice(0, 14);
async function token(request: APIRequestContext, username: string) {
  const response = await request.post('/api/auth/login', { data: { username, password } });
  expect(response.ok()).toBeTruthy();
  return (await response.json()).token as string;
}
async function reader(request: APIRequestContext) {
  const username = `journey_${unique()}`;
  const response = await request.post('/api/auth/register', { data: { username, email: `${username}@example.invalid`, password } });
  expect(response.ok()).toBeTruthy();
  return { username, token: await token(request, username) };
}
async function login(page: Page, username: string) {
  await page.goto('/auth/login');
  await page.locator('input[name="username"]').fill(username);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole('button', { name: 'Iniciar sesión', exact: false }).click();
  await expect(page).not.toHaveURL(/\/auth\//);
}
async function createBook(request: APIRequestContext, title: string) {
  const response = await request.post('/api/books', { headers: { Authorization: `Bearer ${await token(request, 'qa_librarian')}` }, data: {
    title, authors: ['Autor de prueba'], description: 'Libro aislado para comprobar el recorrido de préstamos.', genres: ['Ensayo'], language: 'es', mediaType: 'physical', totalCopies: 1,
  } });
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  return body.id ?? body.data?.id;
}
test.beforeEach(async ({ page, request }) => {
  const fixture = await (await request.get('/__qa')).json();
  expect(fixture.fixture).toBe('booklibrary-phase5');
  expect(fixture.databaseName).toMatch(/^booklibrary_ui_test_[a-f0-9]{32}$/);
  page.on('pageerror', error => { throw error; });
});

test('última copia: reserva, conflicto real en segundo lector y devolución', async ({ page, request, browser }) => {
  const first = await reader(request), second = await reader(request);
  const title = `Última copia ${unique()}`;
  const id = await createBook(request, title);
  expect(id).toBeTruthy();
  await login(page, first.username);
  await page.goto(`/app/catalog/${id}`);
  const secondContext = await browser.newContext();
  try {
    const other = await secondContext.newPage();
    await login(other, second.username);
    await other.goto(`/app/catalog/${id}`);
    const otherReserve = other.getByRole('button', { name: 'Reservar ejemplar' });
    await expect(otherReserve).toBeEnabled();
    await page.getByRole('button', { name: 'Reservar ejemplar' }).click();
    await expect(page.getByRole('button', { name: 'Reservar ejemplar' })).toBeHidden();
    const conflict = other.waitForResponse(response => response.url().endsWith('/api/loans') && response.request().method() === 'POST');
    await otherReserve.click();
    expect((await conflict).status()).toBe(409);
    await expect(other.getByRole('status')).toContainText('no tiene ejemplares disponibles');
    const mine = await request.get('/api/loans/my', { headers: { Authorization: `Bearer ${first.token}` } });
    const loan = (await mine.json()).items.find((item: any) => item.bookId === id);
    expect(loan).toBeTruthy();
    await login(page, 'qa_librarian');
    await page.goto(`/librarian/loans?bookId=${id}`);
    await page.locator('table button[data-detail]').first().click();
    await page.getByRole('button', { name: 'Registrar devolución' }).click();
    await page.getByRole('button', { name: 'Confirmar', exact: true }).click();
    await expect(page.getByRole('dialog').locator('.badge')).toHaveText('Devuelto');
    await other.reload();
    await expect(other.getByRole('button', { name: 'Reservar ejemplar' })).toBeEnabled();
    const book = await (await request.get(`/api/books/${id}`, { headers: { Authorization: `Bearer ${second.token}` } })).json();
    expect(book.availableCopies).toBe(1);
  } finally { await secondContext.close(); }
});

test('bibliotecario crea un libro, ajusta inventario y recibe su devolución', async ({ page, request }) => {
  const title = `Circulación ${unique()}`;
  await login(page, 'qa_librarian');
  await page.goto('/librarian/books');
  await page.getByRole('button', { name: 'Crear libro', exact: true }).click();
  const editor = page.locator('app-book-editor');
  await editor.locator('[formControlName="title"]').fill(title);
  await editor.locator('[formControlName="authors"]').fill('Autora de ejemplo');
  await editor.locator('[formControlName="description"]').fill('Descripción completa del libro físico de prueba.');
  await editor.locator('[formControlName="genres"]').fill('Ensayo');
  await editor.locator('[formControlName="totalCopies"]').fill('1');
  await editor.getByRole('button', { name: 'Guardar libro' }).click();
  await expect(editor).toBeHidden();
  await page.locator('input[name="query"]').fill(title);
  await page.getByRole('button', { name: 'Aplicar filtros' }).click();
  await page.getByRole('button', { name: `Editar ${title}`, exact: true }).first().click();
  await editor.locator('[formControlName="totalCopies"]').fill('2');
  await editor.getByRole('button', { name: 'Guardar libro' }).click();
  await expect(editor).toBeHidden();
  await expect(page.locator('tbody')).toContainText('2 de 2 disponibles');
  const headers = { Authorization: `Bearer ${await token(request, 'qa_librarian')}` };
  const books = await (await request.get(`/api/books?query=${encodeURIComponent(title)}`, { headers })).json();
  const id = books.items[0].id;
  const borrower = await reader(request);
  expect((await request.post('/api/loans', { headers: { Authorization: `Bearer ${borrower.token}` }, data: { bookId: id } })).status()).toBe(201);
  await page.goto(`/librarian/loans?bookId=${id}`);
  await page.locator('table button[data-detail]').first().click();
  await page.getByRole('button', { name: 'Registrar devolución' }).click();
  await page.getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(page.getByRole('dialog').locator('.badge')).toHaveText('Devuelto');
  expect((await (await request.get(`/api/books/${id}`, { headers })).json()).availableCopies).toBe(2);
});

test('admin cambia rol y estado, invalida sesión y encuentra su auditoría', async ({ page, request }) => {
  const account = await reader(request);
  await login(page, 'qa_admin');
  await page.goto(`/admin/users?query=${account.username}`);
  await page.getByRole('button', { name: `Editar usuario ${account.username}`, exact: true }).first().click();
  await page.getByRole('dialog').getByRole('combobox', { name: 'Rol', exact: true }).selectOption('librarian');
  await page.getByRole('dialog').getByRole('button', { name: 'Actualizar usuario', exact: false }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page.locator('tbody')).toContainText('Bibliotecario');
  expect((await request.get('/api/profile/me', { headers: { Authorization: `Bearer ${account.token}` } })).status()).toBe(401);
  await page.getByRole('button', { name: `Desactivar usuario ${account.username}`, exact: true }).first().click();
  await page.getByRole('button', { name: 'Confirmar desactivación', exact: true }).click();
  await expect(page.getByRole('alertdialog')).toBeHidden();
  await expect(page.locator('tbody')).toContainText('Inactiva');
  expect((await request.post('/api/auth/login', { data: { username: account.username, password } })).status()).toBe(401);
  const adminToken = await token(request, 'qa_admin');
  const users = await (await request.get(`/api/admin/users?query=${account.username}`, { headers: { Authorization: `Bearer ${adminToken}` } })).json();
  const userId = users.items[0].id;
  await page.goto(`/admin/logs?targetId=${userId}`);
  await expect(page.locator('tbody')).toContainText('user.');
  await page.getByRole('button', { name: 'Ver detalle', exact: true }).first().click();
  await expect(page.getByRole('dialog')).toContainText(userId);
});

test('KPI vencidos concilia con el listado filtrado', async ({ page }) => {
  await login(page, 'qa_admin');
  await page.goto('/admin/dashboard');
  const metric = page.locator('app-metric-card[label="Vencidas"]');
  await expect(metric).toContainText('1');
  await metric.getByRole('link').click();
  await expect(page).toHaveURL(/status=overdue/);
  await expect(page.locator('tbody tr')).toHaveCount(1);
  await expect(page.locator('tbody')).toContainText('Reserva vencida de prueba');
  await expect(page.locator('tbody .badge')).toHaveText('Vencido');
});

test('catálogo: red lenta, timeout, error recuperable y estado vacío', async ({ page }) => {
  await login(page, 'qa_user');
  let mode: 'slow' | 'timeout' | 'server' | 'empty' | 'real' = 'slow';
  let release!: () => void;
  const waiting = new Promise<void>(resolve => release = resolve);
  await page.route(/\/api\/books\?/, async route => {
    if (mode === 'slow') { await waiting; return route.abort('timedout'); }
    if (mode === 'timeout') return route.abort('timedout');
    if (mode === 'server') return route.fulfill({ status: 503, json: { title: 'Servicio temporalmente no disponible', status: 503 } });
    if (mode === 'empty') return route.fulfill({ json: { items: [], page: 1, pageSize: 20, totalItems: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false } });
    return route.continue();
  });
  await page.goto('/app/catalog');
  await expect(page.getByLabel('Cargando catálogo')).toBeVisible();
  mode = 'timeout'; release();
  await expect(page.getByRole('button', { name: 'Reintentar', exact: true })).toBeVisible();
  mode = 'server';
  await page.getByRole('button', { name: 'Reintentar', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Servicio temporalmente');
  mode = 'empty';
  await page.getByRole('button', { name: 'Reintentar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'No encontramos libros' })).toBeVisible();
  mode = 'real';
  await page.reload();
  await expect(page.locator('app-book-card').first()).toBeVisible();
});

test('paginación restaura filtros, muestra un libro y conserva resultados al fallar una actualización', async ({ page, request }) => {
  const title = `Paginación ${unique()}`;
  await createBook(request, `${title} A`);
  await createBook(request, `${title} B`);
  await login(page, 'qa_user');
  await page.goto(`/app/catalog?query=${encodeURIComponent(title)}&pageSize=1&sort=title&direction=asc`);
  await expect(page.locator('app-book-card')).toHaveCount(1);
  await expect(page.locator('app-book-card')).toContainText(`${title} A`);
  await page.getByRole('button', { name: 'Siguiente', exact: true }).click();
  await expect(page).toHaveURL(/page=2/);
  await expect(page.locator('app-book-card')).toContainText(`${title} B`);
  await page.reload();
  await expect(page.locator('app-book-card')).toContainText(`${title} B`);
  await page.route(/\/api\/books\?/, route => route.fulfill({ status: 503, json: { title: 'Actualización no disponible', status: 503 } }));
  await page.getByRole('button', { name: 'Anterior', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Actualización no disponible');
  await expect(page.locator('app-book-card')).toContainText(`${title} B`);
  await page.unroute(/\/api\/books\?/);
  await page.getByRole('button', { name: 'Reintentar', exact: true }).click();
  await expect(page.getByRole('alert')).toBeHidden();
  await expect(page.locator('app-book-card')).toContainText(`${title} A`);
});

test('teclado: modal, restauración de foco y ampliación de contenido', async ({ page }, info) => {
  await login(page, 'qa_admin');
  await page.goto('/admin/users');
  const edit = page.getByRole('button', { name: 'Editar usuario qa_admin', exact: true }).first();
  await edit.focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  for (const key of ['Tab', 'Tab', 'Shift+Tab']) {
    await page.keyboard.press(key);
    expect(await dialog.evaluate(node => node.contains(document.activeElement))).toBeTruthy();
  }
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(edit).toBeFocused();
  await page.setViewportSize({ width: 1280, height: 960 });
  // CSS magnification checks content reflow; this is not a screen-reader or browser-zoom certification.
  await page.evaluate(() => document.documentElement.style.zoom = '2');
  await expect(page.getByRole('heading', { name: 'Control de usuarios' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBeTruthy();
  await page.screenshot({ path: info.outputPath('content-magnified-200.png'), fullPage: true });
});
