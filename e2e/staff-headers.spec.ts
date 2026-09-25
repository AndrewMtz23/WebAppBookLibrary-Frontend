import { qaEmail } from './qa-identity';
import { expect, test } from '@playwright/test';

for (const role of ['admin', 'librarian']) {
  test(`${role}: encabezados alineados sin barra superior`, async ({ page, request }, info) => {
    const fixture = await (await request.get('/__qa')).json();
    expect(fixture.fixture).toBe('booklibrary-phase5');
    await page.goto('/auth/login');
    await page.getByRole('textbox', { name: 'Correo electrónico', exact: true }).fill(qaEmail(`qa_${role}`));
    await page.locator('input[name="password"]').fill('QaLocalOnly!2026');
    await page.getByRole('button', { name: 'Iniciar sesión', exact: false }).click();
    await expect(page).not.toHaveURL(/\/auth\//);
    for (const module of role === 'admin' ? ['dashboard', 'users', 'books', 'loans', 'logs', 'security'] : ['dashboard', 'books', 'loans']) {
      await page.goto(`/${role}/${module}`);
      const header = page.locator('app-staff-page-header');
      await expect(header).toBeVisible();
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('.workspace__topbar')).toHaveCount(0);
      for (const width of [1440, 360]) {
        await page.setViewportSize({ width, height: 900 });
        const title = (await header.locator('h1').boundingBox())!;
        const icon = (await header.locator('mat-icon').boundingBox())!;
        const description = (await header.locator('p').boundingBox())!;
        expect(icon.x).toBeLessThan(title.x);
        expect(description.y).toBeGreaterThanOrEqual(title.y + title.height);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBeTruthy();
        if (module === 'books') await page.screenshot({ path: info.outputPath(`books-${width}.png`), fullPage: true });
      }
    }
  });
}
