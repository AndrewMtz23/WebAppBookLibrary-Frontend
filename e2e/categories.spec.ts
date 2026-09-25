import { qaEmail } from './qa-identity';
import { expect, test, Page } from '@playwright/test';

async function login(page: Page, username: string) {
  await page.goto('/auth/login');
  await page.locator('input[name="email"]').fill(qaEmail(username));
  await page.locator('input[name="password"]').fill('QaLocalOnly!2026');
  await page.getByRole('button', { name: 'Iniciar sesión', exact: false }).click();
  await expect(page).not.toHaveURL(/\/auth\//);
}
test.beforeEach(async ({ request }) => {
  const fixture = await (await request.get('/__qa')).json();
  expect(fixture.databaseName).toMatch(/^booklibrary_ui_test_[a-f0-9]{32}$/);
});

test('categorías: CRUD, duplicados, versión y borrado en uso', async ({ page, request }) => {
  await login(page, 'qa_admin');
  await page.goto('/admin/categories');
  const name = `Categoría QA ${Date.now()}`;
  const create = page.getByRole('button', { name: 'Crear categoría', exact: true });
  await create.click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Nombre *').fill(name);
  await dialog.getByRole('button', { name: 'Guardar categoría' }).click();
  await expect(dialog).toBeHidden();
  let row = page.getByRole('row').filter({ hasText: name });
  await expect(row).toBeVisible();
  await create.click();
  await dialog.getByLabel('Nombre *').fill(name.toUpperCase());
  await dialog.getByRole('button', { name: 'Guardar categoría' }).click();
  await expect(dialog.getByRole('alert')).toContainText('Conflicto');
  await expect(dialog.getByLabel('Nombre *')).toHaveValue(name.toUpperCase());
  await dialog.getByRole('button', { name: 'Cancelar' }).click();
  await expect(create).toBeFocused();
  await row.getByRole('button', { name: 'Editar', exact: true }).click();
  await dialog.getByLabel('Nombre *').fill(name + ' editada');
  await dialog.getByRole('button', { name: 'Guardar categoría' }).click();
  await expect(dialog).toBeHidden();
  row = page.getByRole('row').filter({ hasText: name + ' editada' });
  await row.getByRole('button', { name: 'Desactivar', exact: true }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Confirmar' }).click();
  await expect(row.locator('.badge')).toHaveText('Inactiva');
  expect((await (await request.get('/api/categories')).json()).items.some((c: any) => c.name === name + ' editada')).toBeFalsy();
  await row.getByRole('button', { name: 'Eliminar', exact: true }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Confirmar' }).click();
  await expect(row).toBeHidden();
  await expect(page.getByRole('row').filter({ hasText: 'Ensayo' }).getByRole('button', { name: 'Eliminar', exact: true })).toBeDisabled();
});

test('bibliotecario asigna IDs e invitado filtra el catálogo', async ({ page, request }) => {
  await login(page, 'qa_librarian');
  await page.goto('/librarian/books');
  await expect(page.locator('a[href="/admin/categories"]')).toHaveCount(0);
  await page.getByRole('button', { name: 'Crear libro', exact: true }).click();
  const editor = page.locator('app-book-editor');
  const title = `Libro clasificado ${Date.now()}`;
  await editor.locator('[formControlName="title"]').fill(title);
  await editor.locator('[formControlName="authors"]').fill('Autora de prueba');
  await editor.locator('[formControlName="description"]').fill('Descripción completa del libro para verificar categorías.');
  await editor.getByRole('button', { name: 'Ensayo', exact: true }).click();
  await editor.locator('[formControlName="totalCopies"]').fill('2');
  const saving = page.waitForResponse(r => r.url().endsWith('/api/books') && r.request().method() === 'POST');
  await editor.getByRole('button', { name: 'Guardar libro' }).click();
  const response = await saving;
  expect(response.status()).toBe(201);
  expect(response.request().postDataJSON().categoryIds).toHaveLength(1);
  expect(response.request().postDataJSON().genres).toBeUndefined();
  await expect(editor).toBeHidden();
  const category = (await (await request.get('/api/categories?query=Ensayo')).json()).items[0];
  const books = await (await request.get(`/api/books?categoryId=${category.id}`)).json();
  expect(books.items.some((b: any) => b.title === title)).toBeTruthy();
  const legacy = await (await request.get('/api/books?genre=Ensayo')).json();
  expect(legacy.totalItems).toBe(books.totalItems);
});

test('categorías y modal: cuatro tamaños, claro/oscuro, teclado y accesibilidad', async ({ page }, info) => {
  await login(page, 'qa_admin');
  await page.goto('/admin/categories');
  await expect(page.getByRole('row').filter({ hasText: 'Ensayo' })).toBeVisible();
  for (const theme of ['light', 'dark']) {
    await page.evaluate(theme => document.documentElement.setAttribute('data-theme', theme), theme);
    for (const width of [360, 768, 1366, 1920]) {
      await page.setViewportSize({ width, height: 900 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBeTruthy();
      await page.screenshot({ path: info.outputPath(`categories-${theme}-${width}.png`), fullPage: true });
      const create = page.getByRole('button', { name: 'Crear categoría', exact: true });
      await create.click();
      const dialog = page.getByRole('dialog');
      await expect(dialog.getByLabel('Nombre *')).toBeFocused();
      await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
      const violations = await page.evaluate(async () => (await (window as any).axe.run('[role="dialog"]', {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] }
      })).violations.map((v: any) => ({ id: v.id, nodes: v.nodes.map((n: any) => n.failureSummary) })));
      expect(violations).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBeTruthy();
      await page.screenshot({ path: info.outputPath(`modal-${theme}-${width}.png`), fullPage: true });
      await page.keyboard.press('Escape');
      await expect(dialog).toBeHidden();
      await expect(create).toBeFocused();
    }
  }
});
