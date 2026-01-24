import { test, expect } from '@playwright/test';

// Reset storage state for auth tests to ensure clean slate
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Authentication Flows', () => {
    test('Login with valid credentials', async ({ page }) => {
        await page.goto('/login');
        await page.getByPlaceholder('seu@email.com').fill('admin@cozinhaaolucro.com');
        await page.getByPlaceholder('Sua senha segura').fill('admin123');
        await page.getByRole('button', { name: 'Entrar' }).click();

        await expect(page).toHaveURL(/.*dashboard/);
    });

    // test('Register new user', async ({ page }) => {
    //     await page.goto('/register');
    //     // Fill registration form...
    // });
});
