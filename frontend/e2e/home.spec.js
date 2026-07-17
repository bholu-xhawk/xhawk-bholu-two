import { expect, test } from '@playwright/test'

test('shows the portfolio home page', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Welcome' })).toBeVisible()
  await expect(page.getByText('This is a dummy animated portfolio built with React, Vite, and Framer Motion.')).toBeVisible()
})

test('navigates to the about page from the navbar', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('link', { name: 'About' }).click()

  await expect(page).toHaveURL(/\/about$/)
  await expect(page.getByRole('heading', { name: 'About' })).toBeVisible()
})
