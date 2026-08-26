import { expect, test } from '@playwright/test'

test('loads the portfolio homepage', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Welcome' })).toBeVisible()
  await expect(page.getByText('dummy animated portfolio')).toBeVisible()
})

test('navigates to public portfolio pages from the navbar', async ({ page }) => {
  await page.goto('/')

  const destinations = [
    { link: 'Projects', path: '/projects', heading: 'Projects', text: 'Project One' },
    { link: 'Resume', path: '/resume', heading: 'Resume', text: 'Download a PDF version' },
    { link: 'Contact', path: '/contact', heading: 'Contact', text: 'Want to get in touch?' },
  ]

  for (const destination of destinations) {
    await page.getByRole('link', { name: destination.link }).click()
    await expect(page).toHaveURL(destination.path)
    await expect(page.getByRole('heading', { name: destination.heading })).toBeVisible()
    await expect(page.getByText(destination.text)).toBeVisible()
  }
})
