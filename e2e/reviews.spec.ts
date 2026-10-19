import { expect, test, Page, APIRequestContext } from '@playwright/test';
import { randomUUID } from 'node:crypto';
const password = 'QaLocalOnly!2026';
async function login(page: Page, email: string) {
  await page.goto('/auth/login'); await page.getByRole('textbox', { name: 'Correo electrónico', exact: true }).fill(email);
  await page.locator('input[name="password"]').fill(password); await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click(); await expect(page).not.toHaveURL(/\/auth\//);
}
async function reader(request: APIRequestContext, admin: Record<string, string>) {
  const name = 'review_' + randomUUID().replaceAll('-', '').slice(0, 10), email = name + '@example.invalid';
  expect((await request.post('/api/admin/users', { headers: admin, data: { username: name, displayName: name, email, password, role: 'user' } })).ok()).toBeTruthy();
  const auth = await (await request.post('/api/auth/login', { data: { email, password } })).json(), headers = { Authorization: `Bearer ${auth.token}` };
  expect((await request.post('/api/auth/email-verification/request', { headers })).status()).toBe(202);
  let token = ''; await expect.poll(async () => { const mail = await (await request.get('/__qa/mail')).json(); token = mail.find((m: any) => m.email === email && m.purpose === 'verify')?.token ?? ''; return token.length; }, { timeout: 15000 }).toBe(43);
  expect((await request.post('/api/auth/email-verification/confirm', { data: { token } })).status()).toBe(204);
  return { email, name, headers };
}
test('reviews reconcile ratings and preserve moderation across editing and removal', async ({ page, request, browser }, info) => {
  test.setTimeout(120000);
  const qa = await (await request.get('/__qa')).json(); expect(qa.databaseName).toMatch(/^booklibrary_ui_test_/);

  const auth = await (await request.post('/api/auth/login', { data: { email: 'admin@booklibrary.invalid', password } })).json(), admin = { Authorization: `Bearer ${auth.token}` };
  const createdBook = await request.post('/api/books', { headers: admin, data: { title: 'Review QA '+randomUUID(), authors: ['QA Author'], description: 'A synthetic book for review acceptance tests.', genres: ['Narrativa'], mediaType: 'digital', digitalResourceUrl: 'https://example.invalid/book' } });
  expect(createdBook.status()).toBe(201); const book = await createdBook.json();
  const a = await reader(request, admin), b = await reader(request, admin);
  await login(page, a.email); await page.goto('/app/catalog/' + book.id); const panel = page.locator('app-book-reviews');
  await panel.getByRole('radio', { name: '5 de 5 estrellas', exact: true }).check(); await panel.getByLabel('Tu reseña', { exact: false }).fill('<img src=x onerror=alert(1)> Mi lectura');
  await panel.getByRole('button', { name: 'Guardar reseña', exact: true }).click(); await expect(panel.locator('.review')).toContainText('Mi lectura'); expect(await panel.locator('.review-text img').count()).toBe(0);
  expect((await request.put(`/api/books/${book.id}/reviews/my`, { headers: b.headers, data: { rating: 3, text: 'Otra opinión', expectedVersion: 0 } })).ok()).toBeTruthy();
  await page.reload(); await expect(panel.locator('.rating-summary')).toContainText('4.0');
  const own = await (await request.get(`/api/books/${book.id}/reviews/my`, { headers: a.headers })).json();
  const guestContext = await browser.newContext(), guest = await guestContext.newPage();
  await guest.goto('/app/catalog/'+book.id); await expect(guest.locator('app-book-reviews .rating-summary')).toContainText('4.0'); await expect(guest.locator('app-book-reviews').getByRole('link',{name:'Iniciar sesión'})).toBeVisible(); await guestContext.close();
  const reporterContext = await browser.newContext(), reporter = await reporterContext.newPage();
  await login(reporter,b.email); await reporter.goto('/app/catalog/'+book.id);
  await reporter.getByRole('button',{name:'Reportar reseña de '+a.name,exact:true}).click(); await reporter.getByLabel('Motivo del reporte privado').fill('Revisar '+a.name); await reporter.getByRole('button',{name:'Enviar reporte',exact:true}).click(); await expect(reporter.locator('app-book-reviews')).toContainText('Reporte recibido'); await reporterContext.close();
  const staffContext = await browser.newContext(), staff = await staffContext.newPage();
  try {
    await login(staff, 'admin@booklibrary.invalid'); await staff.goto('/admin/reviews'); await staff.locator('.queue-row').filter({ hasText: 'Revisar '+a.name }).getByRole('button', { name: 'Revisar reporte', exact: true }).click();
    await staff.getByLabel('Explicación privada al autor').fill('Motivo privado de prueba'); await staff.getByRole('button', { name: 'Ocultar / mantener oculta', exact: true }).click(); await expect(staff.locator('.panel')).toContainText('Oculta por moderación');
    await staff.locator('.queue-row').filter({hasText:'Revisar '+a.name}).getByRole('button',{name:'Revisar reporte',exact:true}).click();
    await staff.getByLabel('Motivo de resolución').fill('Contenido revisado y ocultado'); await staff.getByRole('button',{name:'Resolver con acción tomada'}).click();
    await expect(staff.locator('.queue-row').filter({hasText:'Revisar '+a.name})).toHaveCount(0);
    for (const theme of ['light','dark']) {
      await staff.evaluate(t=>document.documentElement.setAttribute('data-theme',t),theme);
      for (const width of [360,1366]) {
        await staff.setViewportSize({width,height:900}); expect(await staff.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBeTruthy();
        await staff.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
        expect(await staff.evaluate(async()=> (await(window as any).axe.run('app-admin-reviews',{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map((v:any)=>v.id))).toEqual([]);
      }
    }
    await page.goto('/app/notifications'); await page.getByRole('link', { name: 'Ver reseña' }).first().click(); await expect(page.locator('app-my-review')).toContainText('Motivo privado de prueba');
    await page.goto('/app/catalog/' + book.id); await expect(panel.locator('.rating-summary')).toContainText('3.0');
    await panel.getByLabel('Tu reseña', { exact: false }).fill('Contenido editado'); await panel.getByRole('button', { name: 'Guardar reseña', exact: true }).click(); await expect(panel.locator('.state')).toContainText('Oculta por moderación');
    await panel.getByRole('radio',{name:'5 de 5 estrellas',exact:true}).focus(); await page.keyboard.press('ArrowLeft'); await expect(panel.getByRole('radio',{name:'4 de 5 estrellas',exact:true})).toBeChecked(); await page.keyboard.press('ArrowRight');
    for (const theme of ['light', 'dark']) {
      await page.evaluate(t => document.documentElement.setAttribute('data-theme', t), theme);
      for (const width of [360, 1366]) {
        await page.setViewportSize({ width, height: 900 }); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBeTruthy();
        await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
        expect(await page.evaluate(async () => (await (window as any).axe.run('app-book-reviews', { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } })).violations.map((v: any) => v.id))).toEqual([]);
        await page.screenshot({ fullPage: true, path: info.outputPath(`reviews-${theme}-${width}.png`) });
      }
    }
    await panel.getByText('Retirar mi reseña', { exact: true }).click(); await panel.getByRole('button', { name: 'Confirmar retirada' }).click(); await expect(panel.locator('.state')).toContainText('Retirada');
    await staff.getByLabel('ID del libro').fill(book.id); await staff.getByRole('button', { name: 'Filtrar / actualizar' }).click(); await staff.getByRole('button', { name: 'Revisar reseña', exact: true }).first().click();
    await staff.getByLabel('Explicación privada al autor').fill('Restauración revisada'); await staff.getByRole('button', { name: 'Restaurar / levantar bloqueo' }).click(); await expect(staff.locator('.panel')).toContainText('Retirada');
    const summary = await (await request.get(`/api/books/${book.id}/reviews`)).json(); expect(summary.total).toBe(1); expect(summary.averageRating).toBe(3); expect(JSON.stringify(summary)).not.toContain(a.email); expect(JSON.stringify(summary)).not.toContain('Motivo privado');
  } finally { await staffContext.close(); }
});
