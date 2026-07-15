import { expect, test } from '@playwright/test'

test('shows the home page welcome heading', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: /welcome/i })).toBeVisible()
})
