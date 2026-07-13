// Example Playwright test (disabled by default). Rename to example.spec.js to enable.
import { test, expect } from '@playwright/test';

// Ensure Playwright browsers are installed: npx playwright install

// Example test: checks the home page shows the Welcome heading
// To run: npm run test:e2e --prefix frontend (after renaming this file and installing browsers)
test('home page shows Welcome heading', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /welcome/i })).toBeVisible();
});
