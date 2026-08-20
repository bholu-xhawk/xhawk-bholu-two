import { expect, test } from '@playwright/test'

const routes = [
  { label: 'Home', path: '/', heading: 'Welcome' },
  { label: 'About', path: '/about', heading: 'About' },
  { label: 'Projects', path: '/projects', heading: 'Projects' },
  { label: 'Skills', path: '/skills', heading: 'Skills' },
  { label: 'Experience', path: '/experience', heading: 'Experience' },
  { label: 'Blog', path: '/blog', heading: 'Blog' },
  { label: 'Resume', path: '/resume', heading: 'Resume' },
  { label: 'Setup', path: '/setup', heading: 'Setup' },
  { label: 'Contact', path: '/contact', heading: 'Contact' },
]

async function expectRoute(page, route) {
  await expect(page).toHaveURL(new RegExp(`${route.path === '/' ? '/' : route.path}$`))
  await expect(page.getByRole('heading', { name: route.heading, level: 1 })).toBeVisible()
  await expect(page.getByRole('link', { name: route.label })).toHaveClass(/active/)
}

test('loads the home page with the navbar', async ({ page }) => {
  await page.goto('/')

  await expectRoute(page, routes[0])
  await expect(page.getByRole('link', { name: 'My Portfolio' })).toBeVisible()
})

test('navigates portfolio routes from the navbar', async ({ page }) => {
  await page.goto('/')

  for (const route of routes.slice(1)) {
    await test.step(`navigate to ${route.label}`, async () => {
      await page.getByRole('link', { name: route.label }).click()
      await expectRoute(page, route)
    })
  }
})

test('supports direct visits to every portfolio route', async ({ page }) => {
  for (const route of routes) {
    await test.step(`visit ${route.path}`, async () => {
      await page.goto(route.path)
      await expectRoute(page, route)
    })
  }
})

test('fills and submits the contact form without leaving the page', async ({ page }) => {
  await page.goto('/contact')

  await page.getByPlaceholder('Your Name').fill('E2E Visitor')
  await page.getByPlaceholder('Your Email').fill('visitor@example.com')
  await page.getByPlaceholder('Your Message').fill('This message is submitted by Playwright.')
  await page.getByRole('button', { name: 'Send' }).click()

  await expect(page).toHaveURL(/\/contact$/)
  await expect(page.getByRole('heading', { name: 'Contact', level: 1 })).toBeVisible()
  await expect(page.getByPlaceholder('Your Name')).toHaveValue('E2E Visitor')
  await expect(page.getByPlaceholder('Your Email')).toHaveValue('visitor@example.com')
  await expect(page.getByPlaceholder('Your Message')).toHaveValue('This message is submitted by Playwright.')
})
