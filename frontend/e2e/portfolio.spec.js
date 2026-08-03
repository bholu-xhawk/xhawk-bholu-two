import { expect, test } from '@playwright/test'

test.describe('portfolio navigation', () => {
  test('loads the home page and navigates to key portfolio routes', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('heading', { name: 'Welcome' })).toBeVisible()
    await expect(page.getByText('dummy animated portfolio')).toBeVisible()

    await page.getByRole('link', { name: 'Projects' }).click()
    await expect(page).toHaveURL(/\/projects$/)
    await expect(page.getByRole('heading', { name: 'Projects' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Project One' })).toBeVisible()

    await page.getByRole('link', { name: 'Resume' }).click()
    await expect(page).toHaveURL(/\/resume$/)
    await expect(page.getByRole('heading', { name: 'Resume' })).toBeVisible()
    await expect(page.getByText('5+ years building web apps')).toBeVisible()

    await page.getByRole('link', { name: 'Contact' }).click()
    await expect(page).toHaveURL(/\/contact$/)
    await expect(page.getByRole('heading', { name: 'Contact' })).toBeVisible()
  })

  test('allows the contact form fields to be completed without submitting to a backend', async ({ page }) => {
    await page.goto('/contact')

    await page.getByPlaceholder('Your Name').fill('Ada Lovelace')
    await page.getByPlaceholder('Your Email').fill('ada@example.com')
    await page.getByPlaceholder('Your Message').fill('Hello from a Playwright browser test.')

    await expect(page.getByPlaceholder('Your Name')).toHaveValue('Ada Lovelace')
    await expect(page.getByPlaceholder('Your Email')).toHaveValue('ada@example.com')
    await expect(page.getByPlaceholder('Your Message')).toHaveValue('Hello from a Playwright browser test.')
  })
})
