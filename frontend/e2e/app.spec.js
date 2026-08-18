import { expect, test } from '@playwright/test'

test('loads the home page', async ({ page }) => {
  await page.goto('/')

  await expect(page.locator('main')).toContainText('Welcome')
  await expect(page.locator('main')).toContainText(/dummy animated portfolio/i)
})

test('opens the setup page from navigation', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('link', { name: 'Setup' })).toHaveAttribute('href', '/setup')

  await page.getByRole('link', { name: 'Setup' }).evaluate((link) => link.click())

  await expect(page).toHaveURL('/setup')
  await expect(page.locator('main')).toContainText('Setup')
  await expect(page.locator('main')).toContainText(/basic setup instructions/i)
})

test('loads the setup route directly', async ({ page }) => {
  await page.goto('/setup')

  await expect(page.locator('main')).toContainText('Setup')
  await expect(page.locator('main')).toContainText('Run the development server')
})
