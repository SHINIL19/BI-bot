import { test, expect } from '@playwright/test';

test('has title and can chat with mock response', async ({ page }) => {
    await page.goto('/');

    // Expect a title "to contain" a substring.
    await expect(page).toHaveTitle(/BI Agent/); // Adjust to whatever title the app has

    // Check if we can toggle "Mock Data" logic and send a message. Since we forced it on the backend, 
    // any query will get a mock response, so we just check if chat works.
    const input = page.getByPlaceholder('Ask about your revenue, quarters, or margins...');
    await input.fill('What is the total value of all deals in the CRM?');
    await input.press('Enter');

    // Verify that the mock response starts showing up
    await expect(page.locator('text=mock response')).toBeVisible({ timeout: 15000 });
});
