import { expect, test } from '@playwright/test'

test('shows the portfolio home page shell', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('navigation')).toBeAttached()
  await expect(page.getByRole('link', { name: 'My Portfolio' })).toHaveAttribute('href', '/')
  await expect(page.getByRole('heading', { name: 'Welcome' })).toBeAttached()
  await expect(
    page.getByText('This is a dummy animated portfolio built with React, Vite, and Framer Motion.')
  ).toBeAttached()
})

test('navigates to the projects page from the navbar', async ({ page }) => {
  await page.goto('/')

  const projectsLink = page.getByRole('link', { name: 'Projects' })
  await expect(projectsLink).toHaveAttribute('href', '/projects')
  await projectsLink.focus()
  await page.keyboard.press('Enter')

  await expect(page).toHaveURL('/projects')
  await expect(page.getByRole('heading', { name: 'Projects' })).toBeAttached()
  await expect(page.getByRole('heading', { name: 'Project One' })).toBeAttached()
})
