import { test, expect } from '@playwright/test';

test.describe('SmartList', () => {
    test('Generate Shopping List', async ({ page }) => {
        await page.goto('/app/lista-inteligente');
        await expect(page.getByRole('heading', { name: 'Lista Inteligente' })).toBeVisible();
        // Verify ingredients appear
    });
});
