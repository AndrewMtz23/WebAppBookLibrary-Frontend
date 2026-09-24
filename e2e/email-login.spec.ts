import { expect, test } from '@playwright/test';

test('login por correo normalizado mantiene identidad y rechaza nombre de usuario', async ({ page, request }, info) => {
  const fixture = await (await request.get('/__qa')).json();
  expect(fixture.databaseName).toMatch(/^booklibrary_ui_test_[a-f0-9]{32}$/);
  const password = 'QaLocalOnly!2026';
  const result = await request.post('/api/auth/login', { data: { email: '  USER@BOOKLIBRARY.INVALID  ', password } });
  expect(result.status()).toBe(200);
  expect((await result.json()).user.username).toBe('qa_user');
  const wrong = await request.post('/api/auth/login', { data: { email: 'user@booklibrary.invalid', password: 'WrongPassword1' } });
  const absent = await request.post('/api/auth/login', { data: { email: 'absent@booklibrary.invalid', password } });
  expect(wrong.status()).toBe(401); expect(absent.status()).toBe(401);
  expect((await wrong.json()).title).toBe((await absent.json()).title);
  expect((await request.post('/api/auth/login', { data: { email: 'qa_user', password } })).status()).toBe(401);
  await page.goto('/auth/login');
  const email = page.getByRole('textbox', { name: 'Correo electrónico', exact: true });
  await expect(email).toHaveAttribute('type', 'email');
  await email.fill('USER@BOOKLIBRARY.INVALID');
  await page.locator('input[name="password"]').fill(password);
  await page.screenshot({ path: info.outputPath('email-login.png') });
  await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
  await expect(page).toHaveURL(/\/app\/discover/);
});
