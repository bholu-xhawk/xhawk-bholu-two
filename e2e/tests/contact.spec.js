const { test, expect } = require('@playwright/test');

test('contact form can be completed without leaving the contact page', async ({ page }) => {
  const consoleErrors = [];
  const pageErrors = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await page.goto('/contact');
  await expect(page.getByRole('heading', { name: 'Contact', level: 1 })).toBeVisible();

  await page.getByPlaceholder('Your Name').fill('E2E Tester');
  await page.getByPlaceholder('Your Email').fill('e2e@example.com');
  await page.getByPlaceholder('Your Message').fill('This message stays in the client form.');
  await page.getByRole('button', { name: 'Send' }).click();

  await expect(page).toHaveURL(/\/contact$/);
  await expect(page.getByRole('heading', { name: 'Contact', level: 1 })).toBeVisible();
  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
});
