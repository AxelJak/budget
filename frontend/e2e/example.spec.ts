import { test, expect } from '@playwright/test';

test('homepage loads and shows title', async ({ page }) => {
  await page.goto('/');

  // Check that we can see the navigation
  await expect(page.getByRole('heading', { name: /budget/i })).toBeVisible();
});

test('can navigate to categories page', async ({ page }) => {
  await page.goto('/');

  // Click on Categories link
  await page.getByRole('link', { name: /kategorier/i }).click();

  // Should see categories page heading
  await expect(page.getByRole('heading', { name: /kategorier/i })).toBeVisible();

  // Should see the "Ny kategori" button
  await expect(page.getByRole('button', { name: /ny kategori/i })).toBeVisible();
});

test('can navigate to transactions page', async ({ page }) => {
  await page.goto('/');

  // Click on Transactions link
  await page.getByRole('link', { name: /transaktioner/i }).click();

  // Should see transactions page heading
  await expect(page.getByRole('heading', { name: /transaktioner/i })).toBeVisible();
});

test('can navigate to import page', async ({ page }) => {
  await page.goto('/');

  // Click on Import link
  await page.getByRole('link', { name: /import/i }).click();

  // Should see import page heading
  await expect(page.getByRole('heading', { name: /importera/i })).toBeVisible();
});
