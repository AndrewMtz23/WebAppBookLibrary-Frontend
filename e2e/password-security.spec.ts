import { qaEmail } from './qa-identity';
import { expect, test } from '@playwright/test';

for (const role of ['user', 'librarian', 'admin']) {
  test(`cambio de contraseña ${role}: revoca JWT anterior y permite login nuevo`, async ({ page, request }, info) => {
    const fixture = await (await request.get('/__qa')).json();
    expect(fixture.databaseName).toMatch(/^booklibrary_ui_test_[a-f0-9]{32}$/);
    const username = `qa_${role}`, previous = 'QaLocalOnly!2026', next = 'ChangedQaOnly!2026';
    const oldSession = await (await request.post('/api/auth/login', { data: { email: qaEmail(username), password: previous } })).json();
    expect(oldSession.token).toBeTruthy();
    await page.goto('/auth/login');
    await page.locator('input[name="email"]').fill(qaEmail(username));
    await page.locator('input[name="password"]').fill(previous);
    await page.getByRole('button', { name: 'Iniciar sesión', exact: false }).click();
    await expect(page).not.toHaveURL(/\/auth\//);
    await page.goto('/app/profile');
    const form = page.locator('app-change-password');
    await expect(form.getByRole('heading', { name: 'Seguridad de tu cuenta' })).toBeVisible();
    if (role === 'user') {
      await page.setViewportSize({ width: 360, height: 800 });
      await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
      await form.scrollIntoViewIfNeeded();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBeTruthy();
      await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
      expect(await page.evaluate(async () => (await (window as any).axe.run('app-change-password')).violations.map((v: any) => v.id))).toEqual([]);
      await page.screenshot({ path: info.outputPath('password-dark-mobile.png'), fullPage: true });
    }
    await form.getByLabel('Contraseña actual', { exact: true }).fill('WrongPassword1');
    await form.getByLabel('Nueva contraseña', { exact: true }).fill(next);
    await form.getByLabel('Confirmar nueva contraseña', { exact: true }).fill(next);
    await form.getByRole('button', { name: 'Cambiar contraseña', exact: true }).click();
    await expect(form.getByRole('alert')).toContainText('actual no es correcta');
    await form.getByLabel('Contraseña actual', { exact: true }).fill(previous);
    await form.getByRole('button', { name: 'Cambiar contraseña', exact: true }).click();
    await expect(page).toHaveURL(/\/auth\/login/);
    expect((await request.get('/api/profile/me', { headers: { Authorization: `Bearer ${oldSession.token}` } })).status()).toBe(401);
    expect((await request.post('/api/auth/login', { data: { email: qaEmail(username), password: previous } })).status()).toBe(401);
    const fresh = await request.post('/api/auth/login', { data: { email: qaEmail(username), password: next } });
    expect(fresh.status()).toBe(200);
    const token = (await fresh.json()).token;
    expect((await request.get('/api/profile/me', { headers: { Authorization: `Bearer ${token}` } })).status()).toBe(200);
    expect((await request.put('/api/profile/me/password', { headers: { Authorization: `Bearer ${token}` }, data: { currentPassword: next, newPassword: previous } })).status()).toBe(204);
  });
}
