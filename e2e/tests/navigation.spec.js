const { test, expect } = require('@playwright/test');

const routes = [
  { link: 'About', path: '/about', heading: 'About' },
  { link: 'Projects', path: '/projects', heading: 'Projects' },
  { link: 'Skills', path: '/skills', heading: 'Skills' },
  { link: 'Experience', path: '/experience', heading: 'Experience' },
  { link: 'Blog', path: '/blog', heading: 'Blog' },
  { link: 'Resume', path: '/resume', heading: 'Resume' },
  { link: 'Setup', path: '/setup', heading: 'Setup' },
  { link: 'Contact', path: '/contact', heading: 'Contact' },
];

test('navigates between portfolio pages from the navbar', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Welcome', level: 1 })).toBeVisible();

  for (const route of routes) {
    await page.getByRole('link', { name: route.link, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${route.path}$`));
    await expect(page.getByRole('heading', { name: route.heading, level: 1 })).toBeVisible();
  }

  await page.getByRole('link', { name: 'My Portfolio', exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('heading', { name: 'Welcome', level: 1 })).toBeVisible();
});
