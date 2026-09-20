import { expect, test, Page } from '@playwright/test';
import { randomUUID } from 'node:crypto';

const password = 'QaLocalOnly!2026';
test.beforeEach(async ({ request, page }) => {
  const marker = await (await request.get('/__qa')).json();
  expect(marker.fixture).toBe('booklibrary-phase5');
  expect(marker.databaseName).toMatch(/^booklibrary_ui_test_[a-f0-9]{32}$/);
  page.on('pageerror', error => { throw error; });
});

async function signIn(page: Page, username: string) {
  await page.getByRole('textbox', { name: 'Nombre de usuario', exact: true }).fill(username);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
  await expect(page).not.toHaveURL(/\/auth\//);
}

test('visitante: descubre, consulta libros y abre una modal accesible sin peticiones personales', async ({ page, request }, info) => {
  test.setTimeout(180_000);
  const marker = await (await request.get('/__qa')).json();
  const calls: string[] = [];
  page.on('request', r => { if (/\/api\/(?:loans|favorites|profile|dashboard)/.test(r.url())) calls.push(`${r.method()} ${r.url()}`); });
  await page.goto('/');
  await expect(page).toHaveURL(/\/app\/discover$/);
  await expect(page.getByRole('link', { name: 'Iniciar sesión', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Registrarse', exact: true })).toBeVisible();
  for (const theme of ['light', 'dark']) for (const width of [360, 768, 1366, 1920]) {
    await page.setViewportSize({ width, height: width === 360 ? 800 : 900 });
    await page.addInitScript(value => localStorage.setItem('booklibrary_theme', value), theme);
    await page.goto(`/app/catalog/${marker.books[0].id}`);
    await expect(page.locator('h1')).toBeVisible();
    const brand = await page.locator('.reader-navbar .brand').boundingBox();
    const account = await page.locator('.reader-navbar__account').boundingBox();
    expect(brand!.x + brand!.width).toBeLessThanOrEqual(account!.x);
    const save = page.getByRole('button', { name: 'Guardar', exact: true });
    await save.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toHaveCount(1);
    await expect(dialog.getByRole('heading', { name: 'Inicia sesión para continuar' })).toBeVisible();
    const bounds = await dialog.boundingBox();
    expect(bounds!.y).toBeGreaterThanOrEqual(0);
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(page.viewportSize()!.height + 1);
    await expect(dialog.getByRole('link', { name: 'Iniciar sesión', exact: true })).toBeFocused();
    for (const key of ['Tab', 'Shift+Tab']) {
      await page.keyboard.press(key);
      expect(await dialog.evaluate(el => el.contains(document.activeElement))).toBeTruthy();
    }
    await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
    const issues = await page.evaluate(async () => (await (window as any).axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } })).violations.map((v: any) => ({ id: v.id, nodes: v.nodes.map((n: any) => n.target) })));
    expect(issues).toEqual([]);
    await page.screenshot({ path: info.outputPath(`prompt-${theme}-${width}.png`), fullPage: false });
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(save).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBeTruthy();
  }
  for (const book of marker.books.slice(0, 2)) {
    await page.goto(`/app/catalog/${book.id}`);
    await page.getByRole('button', { name: /Reservar/ }).click();
    await expect(page.getByRole('dialog')).toContainText('Para reservar este libro');
    await page.getByRole('button', { name: 'Seguir explorando' }).click();
  }
  expect(calls).toEqual([]);
});

test('login devuelve al libro sin reservar automáticamente y logout conserva navegación pública', async ({ page, request }) => {
  const fixture = await (await request.get('/__qa')).json();
  const path = `/app/catalog/${fixture.books[0].id}`;
  const mutations: string[] = [];
  page.on('request', r => { if (r.method() === 'POST' && /\/api\/(loans|favorites)/.test(r.url())) mutations.push(r.url()); });
  await page.goto(path);
  await page.getByRole('button', { name: /Reservar/ }).click();
  await page.getByRole('dialog').getByRole('link', { name: 'Iniciar sesión', exact: true }).click();
  await expect(page).toHaveURL(/returnUrl=/);
  await signIn(page, 'qa_user');
  await expect(page).toHaveURL(new RegExp(`${fixture.books[0].id}$`));
  expect(mutations).toEqual([]);
  await page.locator('.account-menu__trigger').click();
  await page.getByRole('menuitem', { name: 'Cerrar sesión' }).click();
  await page.getByRole('button', { name: 'Sí, cerrar sesión' }).click();
  await expect(page.getByRole('link', { name: 'Registrarse', exact: true })).toBeVisible();
  await expect(page).toHaveURL(new RegExp(`${fixture.books[0].id}$`));
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
});

test('registro conserva el destino y no confunde credenciales incorrectas con sesión vencida', async ({ page, request }) => {
  const fixture = await (await request.get('/__qa')).json();
  const username = `public_${randomUUID().slice(0, 8)}`;
  await page.goto(`/app/catalog/${fixture.books[1].id}`);
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await page.getByRole('dialog').getByRole('link', { name: 'Crear cuenta' }).click();
  await page.locator('input[name="username"]').fill(username);
  await page.locator('input[name="email"]').fill(`${username}@example.invalid`);
  await page.locator('input[name="password"]').fill(password);
  await page.locator('input[name="confirmPassword"]').fill(password);
  await page.getByRole('button', { name: /Crear cuenta|Registrarse/ }).click();
  await expect(page).toHaveURL(/\/auth\/login\?returnUrl=/);
  await page.locator('input[name="username"]').fill(username);
  await page.locator('input[name="password"]').fill('incorrect-password');
  await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
  await expect(page.locator('.auth-message--error')).toBeVisible();
  await expect(page).toHaveURL(/returnUrl=/);
  await signIn(page, username);
  await expect(page).toHaveURL(new RegExp(`${fixture.books[1].id}$`));
  await expect(page.getByRole('button', { name: 'Guardar', exact: true })).toBeVisible();
});

test('enlaces privados siguen protegidos y no aceptan retorno externo', async ({ page }) => {
  for (const path of ['/app/my-library', '/app/favorites', '/app/profile', '/admin/users', '/librarian/loans']) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/auth\/login\?returnUrl=/);
  }
  await page.goto('/auth/login?returnUrl=https://example.invalid');
  await signIn(page, 'qa_admin');
  await expect(page).toHaveURL(/\/admin\/dashboard$/);
});

test('revalida la ultima copia al regresar del login y separa favoritos entre cuentas', async ({ page, request }) => {
  const accounts: { username: string; token: string }[] = [];
  for (let i = 0; i < 2; i++) {
    const username = `public_${randomUUID().slice(0, 8)}`;
    expect((await request.post('/api/auth/register', { data: { username, password, email: `${username}@example.invalid` } })).ok()).toBeTruthy();
    const response = await request.post('/api/auth/login', { data: { username, password } });
    accounts.push({ username, token: (await response.json()).token });
  }
  const staff = await (await request.post('/api/auth/login', { data: { username: 'qa_librarian', password } })).json();
  const created = await request.post('/api/books', { headers: { Authorization: `Bearer ${staff.token}` }, data: {
    title: `Public stock ${randomUUID().slice(0, 8)}`, authors: ['Autor de prueba'], description: 'Libro aislado para comprobar el recorrido de prestamos.', genres: ['Ensayo'], language: 'es', mediaType: 'physical', totalCopies: 1
  } });
  expect(created.ok(), await created.text()).toBeTruthy();
  const book = await created.json();
  const id = book.id ?? book.data?.id;
  expect(id).toBeTruthy();
  await page.goto(`/app/catalog/${id}`);
  await page.getByRole('button', { name: 'Reservar ejemplar' }).click();
  await page.getByRole('dialog').getByRole('link', { name: 'Iniciar sesión', exact: true }).click();
  const reservation = await request.post('/api/loans', { headers: { Authorization: `Bearer ${accounts[1].token}` }, data: { bookId: id } });
  expect(reservation.ok()).toBeTruthy();
  await signIn(page, accounts[0].username);
  await expect(page.getByRole('button', { name: 'Reservar ejemplar' })).toBeDisabled();
  await expect(page.locator('.availability')).toContainText('Sin ejemplares disponibles');
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Guardado', exact: true })).toBeEnabled();
  await page.locator('.account-menu__trigger').click();
  await page.getByRole('menuitem', { name: 'Cerrar sesión' }).click();
  await page.getByRole('button', { name: 'Sí, cerrar sesión' }).click();
  await expect(page.getByRole('link', { name: 'Registrarse', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Guardar', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Iniciar sesión', exact: true }).click();
  await signIn(page, accounts[1].username);
  await expect(page.getByRole('button', { name: 'Guardar', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Guardado', exact: true })).toHaveCount(0);
  await page.getByRole('link', { name: 'Mi biblioteca', exact: true }).first().click();
  await expect(page).toHaveURL(/\/app\/my-library$/);
  await expect(page.getByRole('button', { name: 'Cancelar', exact: true })).toBeVisible();
  await page.clock.setSystemTime(new Date(Date.now() + 366 * 86400000));
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await expect(page).toHaveURL(/\/auth\/login\?returnUrl=%2Fapp%2Fmy-library$/);
});

test('una sesion vencida en el catalogo permite seguir explorando como visitante', async ({ page }) => {
  await page.goto('/auth/login?returnUrl=%2Fapp%2Fcatalog');
  await signIn(page, 'qa_user');
  await expect(page.locator('app-book-grid')).toBeVisible();
  await page.clock.setSystemTime(new Date(Date.now() + 366 * 86400000));
  await page.locator('app-catalog-search input').fill('Atlas');
  await expect(page.getByRole('link', { name: 'Registrarse', exact: true })).toBeVisible();
  await expect(page).toHaveURL(/\/app\/catalog/);
  await expect(page.locator('app-book-grid')).toBeVisible();
});
