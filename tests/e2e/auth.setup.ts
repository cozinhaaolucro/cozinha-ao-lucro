import { test as setup, expect } from '@playwright/test';

// Define the path where the auth state will be saved
const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
    // Perform authentication steps. Replace these actions with your own.
    await page.goto('/login');

    // Fill in the login form
    // Warning: In a real scenario, use environment variables for credentials!
    await page.getByPlaceholder('seu@email.com').fill('admin@cozinhaaolucro.com');
    await page.getByPlaceholder('Sua senha segura').fill('admin123'); // Assume this seed credential exists

    await page.getByRole('button', { name: 'Entrar' }).click();

    // Wait until the page receives the cookies.
    // Sometimes login flow sets cookies in the process of several redirects.
    // Wait for the final URL to ensure that the cookies are actually set.
    await page.waitForURL('/app/dashboard');

    // Check if we are really logged in
    await expect(page.getByRole('heading', { name: 'Visão Geral' })).toBeVisible();

    // End of authentication steps.
    await page.context().storageState({ path: authFile });
});
