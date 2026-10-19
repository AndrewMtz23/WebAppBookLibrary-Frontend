import { expect, test, Page } from '@playwright/test';
import { randomUUID } from 'node:crypto';

const password = 'QaLocalOnly!2026';
async function login(page: Page, email: string) {
  await page.goto('/auth/login'); await page.getByRole('textbox', { name: 'Correo electrónico', exact: true }).fill(email);
  await page.locator('input[name="password"]').fill(password); await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
  await expect(page).not.toHaveURL(/\/auth\//);
}
test('private support across reader and staff with accessible mobile conversations', async ({ page, request, browser }, info) => {
  const marker = await (await request.get('/__qa')).json(); expect(marker.databaseName).toMatch(/^booklibrary_ui_test_/);
  const adminAuth = await (await request.post('/api/auth/login', { data: { email: 'admin@booklibrary.invalid', password } })).json();
  const admin = { Authorization: `Bearer ${adminAuth.token}` };
  const name = 'support_' + randomUUID().replaceAll('-', '').slice(0, 10); const email = name + '@example.invalid';
  expect((await request.post('/api/admin/users', { headers: admin, data: { username: name, displayName: 'Support reader', email, password, role: 'user' } })).ok()).toBeTruthy();
  await login(page, email); await page.goto('/app/support');
  await expect(page.getByRole('heading', { name: 'Tus solicitudes', exact: true })).toBeVisible();
  for (const width of [1024, 1366]) {
    await page.setViewportSize({ width, height: 900 });
    const navigation = await page.locator('.reader-navbar__navigation').boundingBox();
    const account = await page.locator('.reader-navbar__account app-notification-bell a').boundingBox();
    expect(navigation!.x + navigation!.width).toBeLessThanOrEqual(account!.x);
  }
  const subject = 'Consulta ' + name;
  await page.getByLabel('Asunto', { exact: true }).fill(subject);
  await page.getByLabel('Descripción', { exact: true }).fill('<img src=x onerror=alert(1)> Mi consulta privada');
  await page.getByRole('button', { name: 'Crear solicitud', exact: true }).click();
  await page.getByRole('link', { name: subject, exact: true }).click();
  await expect(page.locator('app-support-detail')).toContainText('<img src=x onerror=alert(1)>');
  expect(await page.locator('app-support-detail img').count()).toBe(0);
  const ticketId = page.url().split('/').pop()!;
  const staffContext = await browser.newContext(); const staffPage = await staffContext.newPage();
  try {
    await login(staffPage, 'librarian@booklibrary.invalid'); await staffPage.goto('/librarian/support');
    await staffPage.getByRole('button', { name: subject, exact: true }).click();
    const detail = staffPage.locator('app-support-detail');
    await detail.getByLabel('Nota interna: no visible para el solicitante').check();
    await detail.getByLabel('Nota interna', { exact: true }).fill('Solo personal: revisión privada');
    await detail.getByRole('button', { name: 'Guardar nota interna', exact: true }).click();
    await expect(detail.locator('.internal-notes')).toContainText('Solo personal');
    await detail.getByLabel('Nota interna: no visible para el solicitante').uncheck();
    await detail.getByLabel('Tu respuesta', { exact: true }).fill('Podemos ayudarte con tu préstamo.');
    await detail.getByRole('button', { name: 'Enviar respuesta', exact: true }).click();
    await expect(detail.locator('.thread')).toContainText('Podemos ayudarte');
    await page.goto('/app/notifications'); await page.locator(`a[href="/app/support/${ticketId}"]`).first().click();
    await expect(page.locator('app-support-detail')).toContainText('Podemos ayudarte');
    await expect(page.locator('app-support-detail')).not.toContainText('Solo personal');
    await detail.getByLabel('Motivo', { exact: true }).fill('Atención iniciada'); await detail.getByRole('button', { name: 'Marcar como En atención', exact: true }).click();
    await expect(detail.locator('.page-heading .status')).toHaveText('En atención');
    await detail.getByLabel('Motivo', { exact: true }).fill('Consulta atendida'); await detail.getByRole('button', { name: 'Marcar como Resuelta', exact: true }).click();
    await expect(detail.locator('.page-heading .status')).toHaveText('Resuelta');
    await page.reload(); await page.getByLabel('Motivo', { exact: true }).fill('Necesito aclarar un detalle'); await page.getByRole('button', { name: 'Reabrir solicitud', exact: true }).click();
    await expect(page.locator('.detail-page .page-heading .status')).toHaveText('Abierta');
    for (const theme of ['light', 'dark']) {
      await page.evaluate(value => document.documentElement.setAttribute('data-theme', value), theme);
      for (const width of [360, 1366]) {
        await page.setViewportSize({ width, height: 900 });
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBeTruthy();
        await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
        expect(await page.evaluate(async () => (await (window as any).axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } })).violations.map((v: any) => ({ id: v.id, nodes: v.nodes.map((n: any) => n.target) })))).toEqual([]);
        await page.screenshot({ path: info.outputPath(`support-${theme}-${width}.png`), fullPage: true });
      }
    }
    await page.getByLabel('Tu respuesta', { exact: true }).focus(); await expect(page.getByLabel('Tu respuesta', { exact: true })).toBeFocused();
    await page.getByLabel('Tu respuesta', { exact: true }).fill('Borrador conservado');
    await page.route(`**/api/support/tickets/${ticketId}/replies`, route => route.fulfill({ status: 409, contentType: 'application/problem+json', body: JSON.stringify({ detail: 'La solicitud cambió.' }) }));
    await page.getByRole('button', { name: 'Enviar respuesta', exact: true }).click();
    await expect(page.locator('.detail-page [role="alert"]')).toContainText('cambió');
    await expect(page.locator('.detail-page [role="alert"]')).toBeFocused();
    await expect(page.getByLabel('Tu respuesta', { exact: true })).toHaveValue('Borrador conservado');
  } finally { await staffContext.close(); }
});
