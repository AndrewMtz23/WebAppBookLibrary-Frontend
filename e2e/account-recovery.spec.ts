import { expect, test, APIRequestContext, Page } from '@playwright/test';
import { randomUUID } from 'node:crypto';

const password = 'QaLocalOnly!2026';
async function account(request: APIRequestContext) {
  const fixture = await (await request.get('/__qa')).json();
  expect(fixture.databaseName).toMatch(/^booklibrary_ui_test_[a-f0-9]{32}$/);
  const username = `recovery_${randomUUID().replaceAll('-', '').slice(0, 12)}`;
  const email = `${username}@example.invalid`;
  expect((await request.post('/api/auth/register', { data: { username, email, password } })).ok()).toBeTruthy();
  const response = await request.post('/api/auth/login', { data: { email, password } });
  expect(response.ok()).toBeTruthy();
  return { email, token: (await response.json()).token };
}
async function mail(request: APIRequestContext, email: string, purpose: string) {
  let message: { link: string; token: string } | undefined;
  await expect.poll(async () => {
    const messages = await (await request.get('/__qa/mail')).json();
    message = messages.find((m: any) => m.email === email && m.purpose === purpose);
    return !!message;
  }, { timeout: 15_000 }).toBeTruthy();
  return message!;
}
async function login(page: Page, email: string) {
  await page.goto('/auth/login');
  await page.getByRole('textbox', { name: 'Correo electrónico', exact: true }).fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await expect(page).not.toHaveURL(/\/auth\//);
}

test('una sesión revocada conserva acceso público sin conceder acceso privado', async ({ request }) => {
  const user = await account(request);
  const headers = { Authorization: `Bearer ${user.token}` };
  expect((await request.put('/api/profile/me/password', { headers, data: { currentPassword: password, newPassword: 'ChangedQa!2026' } })).status()).toBe(204);
  expect((await request.get('/api/profile/me', { headers })).status()).toBe(401);
  expect((await request.get('/api/books', { headers })).status()).toBe(200);
  expect((await request.post('/api/auth/password-reset/request', { headers, data: { email: user.email } })).status()).toBe(202);
});

test('solicitud pública devuelve el mismo contrato para correo conocido, repetido y desconocido', async ({ request }) => {
  const user = await account(request);
  const responses = [];
  for (const email of [user.email, `  ${user.email.toUpperCase()}  `.trim(), `missing_${randomUUID()}@example.invalid`]) {
    const response = await request.post('/api/auth/password-reset/request', { data: { email } });
    expect(response.status()).toBe(202);
    responses.push(await response.json());
  }
  expect(responses[1]).toEqual(responses[0]);
  expect(responses[2]).toEqual(responses[0]);
  expect(JSON.stringify(responses)).not.toContain(user.email);
});

test('recuperación real: fragmento retirado, confirmación POST, uso único y revocación', async ({ page, request }) => {
  const user = await account(request);
  await page.goto('/auth/login');
  await page.getByRole('link', { name: '¿Olvidaste tu contraseña?' }).click();
  await page.getByLabel('Correo electrónico').fill(user.email);
  await page.getByRole('button', { name: 'Solicitar enlace' }).click();
  await expect(page.getByRole('status')).toContainText('Si existe una cuenta');
  const message = await mail(request, user.email, 'reset');
  let posts = 0;
  page.on('request', r => { if (r.url().includes('password-reset/confirm') && r.method() === 'POST') posts++; });
  await page.goto(message.link);
  await expect(page).toHaveURL(/\/auth\/reset-password$/);
  expect(posts).toBe(0);
  await page.getByLabel('Nueva contraseña', { exact: true }).fill('ResetQa!2026');
  await page.getByLabel('Confirmar contraseña', { exact: true }).fill('ResetQa!2026');
  await page.getByRole('button', { name: 'Guardar nueva contraseña' }).click();
  await expect(page.getByRole('status')).toContainText('Tu contraseña se actualizó');
  expect(posts).toBe(1);
  expect((await request.get('/api/profile/me', { headers: { Authorization: `Bearer ${user.token}` } })).status()).toBe(401);
  expect((await request.post('/api/auth/login', { data: { email: user.email, password } })).status()).toBe(401);
  expect((await request.post('/api/auth/login', { data: { email: user.email, password: 'ResetQa!2026' } })).status()).toBe(200);
  await page.goto('/auth/login');
  await page.goto(message.link);
  await page.getByLabel('Nueva contraseña', { exact: true }).fill('AnotherQa!2026');
  await page.getByLabel('Confirmar contraseña', { exact: true }).fill('AnotherQa!2026');
  await page.getByRole('button', { name: 'Guardar nueva contraseña' }).click();
  await expect(page.getByRole('alert')).toContainText('ya se usó');
});

test('verificación real: perfil pendiente, límite, confirmación y estado persistido', async ({ page, request }) => {
  const user = await account(request);
  await login(page, user.email);
  await page.goto('/app/profile');
  const section = page.locator('app-email-verification');
  await expect(section).toContainText('pendiente de verificación');
  await section.getByRole('button', { name: 'Solicitar verificación' }).click();
  await expect(section.getByRole('status')).toContainText('en cola');
  await section.getByRole('button', { name: 'Solicitar verificación' }).click();
  await expect(section.getByRole('alert')).toContainText('Espera un minuto');
  const message = await mail(request, user.email, 'verify');
  await page.goto(message.link);
  await expect(page).toHaveURL(/\/auth\/verify-email$/);
  const headers = { Authorization: `Bearer ${user.token}` };
  expect((await (await request.get('/api/profile/me', { headers })).json()).emailVerifiedAt).toBeNull();
  await page.getByRole('button', { name: 'Confirmar mi correo' }).click();
  await expect(page.getByRole('status')).toContainText('Correo verificado');
  await page.getByRole('link', { name: 'Ir a mi perfil' }).click();
  await expect(section).toContainText('Correo verificado');
  await expect(section.getByRole('button')).toHaveCount(0);
  await page.goto(message.link);
  await page.getByRole('button', { name: 'Confirmar mi correo' }).click();
  await expect(page.getByRole('alert')).toContainText('ya se usó');
});

test('recuperación y verificación: temas, cuatro tamaños, teclado y accesibilidad', async ({ page }, info) => {
  for (const route of ['forgot-password', 'reset-password#token=' + 'a'.repeat(43), 'verify-email#token=' + 'a'.repeat(43)]) {
    await page.goto('/auth/' + route);
    const card = page.locator('app-account-recovery');
    await expect(card.getByRole('heading', { level: 1 })).toBeVisible();
    for (const theme of ['light', 'dark']) {
      await page.evaluate(value => document.documentElement.setAttribute('data-theme', value), theme);
      for (const width of [360, 768, 1366, 1920]) {
        await page.setViewportSize({ width, height: width === 360 ? 800 : 1080 });
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBeTruthy();
        if (width > 800) {
          const contrast = await page.locator('#public-shell-title').evaluate(title => {
            const luminance = (color: string) => {
              const rgb = color.match(/[\d.]+/g)!.slice(0, 3).map(Number).map(n => n / 255)
                .map(n => n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4);
              return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
            };
            const text = luminance(getComputedStyle(title).color);
            const background = luminance(getComputedStyle(title.closest('.public-shell__story')!).backgroundColor);
            return (Math.max(text, background) + 0.05) / (Math.min(text, background) + 0.05);
          });
          expect(contrast).toBeGreaterThanOrEqual(3);
        }
        await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
        expect(await page.evaluate(async () => (await (window as any).axe.run('.public-shell', { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } })).violations.map((v: any) => v.id))).toEqual([]);
        if (width === 360 || width === 1366) await page.screenshot({ path: info.outputPath(`${route.split('#')[0]}-${theme}-${width}.png`), fullPage: true, animations: 'disabled' });
      }
    }
    await card.getByRole('link', { name: 'Volver a iniciar sesión' }).focus();
    await expect(card.getByRole('link', { name: 'Volver a iniciar sesión' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/auth\/login/);
  }
});
