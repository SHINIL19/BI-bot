import { test, expect } from '@playwright/test';

test('has title and can chat with mock response', async ({ page }) => {
    await page.goto('/');

    // Expect a title "to contain" a substring.
    await expect(page).toHaveTitle(/BI-Bot/); // Adjust to whatever title the app has

    // The UI defaults to "Mock Data: ON", so we don't need to click it.

    const input = page.getByPlaceholder('Ask about your Monday.com data...');
    await input.fill('What is the total value of all deals in the CRM?');
    await input.press('Enter');

    // Verify that the mock response starts showing up
    await expect(page.locator('text=mock response')).toBeVisible({ timeout: 15000 });
});
