import { expect, test } from '@playwright/test'

test('booklist supports create, details, edit, single delete, and bulk delete', async ({ page }) => {
  page.on('dialog', (dialog) => dialog.accept());

  await page.goto('/booklist');

  await expect(page.getByRole('heading', { name: 'Booklist' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Clean Code' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'The Pragmatic Programmer' })).toBeVisible();

  await page.getByLabel('Title').fill('The Left Hand of Darkness');
  await page.getByLabel('Author').fill('Ursula K. Le Guin');
  await page.getByLabel('Genre').fill('Science Fiction');
  await page.getByLabel('Year').fill('1969');
  await page.getByLabel('Status').selectOption('reading');
  await page.getByLabel('Rating').fill('5');
  await page.getByLabel('Image URL').fill('data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="240" height="320"%3E%3Crect width="100%25" height="100%25" fill="%232563eb"/%3E%3C/svg%3E');
  await page.getByLabel('Description').fill('A classic novel about identity, politics, and first contact.');
  await page.getByRole('button', { name: 'Create book' }).click();

  await expect(page.getByRole('link', { name: 'The Left Hand of Darkness' })).toBeVisible();

  await page.getByRole('link', { name: 'The Left Hand of Darkness' }).click();
  await expect(page.getByRole('heading', { name: 'The Left Hand of Darkness' })).toBeVisible();
  await expect(page.getByText('by Ursula K. Le Guin')).toBeVisible();
  await expect(page.getByText('A classic novel about identity, politics, and first contact.')).toBeVisible();
  await expect(page.getByAltText('The Left Hand of Darkness cover')).toBeVisible();

  await page.getByRole('link', { name: /Back to Booklist/ }).click();
  const createdRow = page.getByRole('row', { name: /The Left Hand of Darkness/ });
  await createdRow.getByRole('button', { name: 'Edit' }).click();
  await createdRow.getByLabel('Title').fill('The Dispossessed');
  await createdRow.getByLabel('Description').fill('An edited description for the row.');
  await createdRow.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByRole('link', { name: 'The Dispossessed' })).toBeVisible();

  const editedRow = page.getByRole('row', { name: /The Dispossessed/ });
  await editedRow.getByRole('button', { name: 'Delete' }).click();
  await expect(page.getByRole('link', { name: 'The Dispossessed' })).toHaveCount(0);

  await page.getByLabel('Select Clean Code').check();
  await page.getByLabel('Select Designing Data-Intensive Applications').check();
  await page.getByRole('button', { name: 'Delete selected' }).click();

  await expect(page.getByRole('link', { name: 'Clean Code' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Designing Data-Intensive Applications' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'The Pragmatic Programmer' })).toBeVisible();
});
