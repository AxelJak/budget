import { test, expect } from '@playwright/test';

test.describe('Transaction Categorization Features', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to transactions page
    await page.goto('/');
    await page.getByRole('link', { name: /transaktioner/i }).click();
    await expect(page.getByRole('heading', { name: /transaktioner/i })).toBeVisible();
  });

  test('should show uncategorized filter button', async ({ page }) => {
    // Check that the filter button exists
    const filterButton = page.getByRole('button', { name: /visa okategoriserade/i });
    await expect(filterButton).toBeVisible();
  });

  test('should toggle uncategorized filter', async ({ page }) => {
    const filterButton = page.getByRole('button', { name: /visa okategoriserade/i });

    // Click to enable filter
    await filterButton.click();

    // Button text should change to show filter is active
    await expect(page.getByRole('button', { name: /visar okategoriserade/i })).toBeVisible();

    // Click again to disable filter
    await page.getByRole('button', { name: /visar okategoriserade/i }).click();

    // Button should go back to original text
    await expect(page.getByRole('button', { name: /visa okategoriserade/i })).toBeVisible();
  });

  test('should show auto-categorize button', async ({ page }) => {
    const autoCategorizeButton = page.getByRole('button', { name: /auto-kategorisera/i });
    await expect(autoCategorizeButton).toBeVisible();
  });

  test('should have checkboxes for bulk selection', async ({ page }) => {
    // Wait for transactions to load
    await page.waitForTimeout(1000);

    // Check for the select-all checkbox in the table header
    const selectAllCheckbox = page.locator('thead input[type="checkbox"]');
    await expect(selectAllCheckbox).toBeVisible();

    // Check for checkboxes in transaction rows
    const rowCheckboxes = page.locator('tbody input[type="checkbox"]');
    const count = await rowCheckboxes.count();

    if (count > 0) {
      // At least one row checkbox should be visible
      await expect(rowCheckboxes.first()).toBeVisible();
    }
  });

  test('should select and deselect transactions', async ({ page }) => {
    // Wait for transactions to load
    await page.waitForTimeout(1000);

    const rowCheckboxes = page.locator('tbody input[type="checkbox"]');
    const count = await rowCheckboxes.count();

    if (count > 0) {
      // Click first checkbox
      await rowCheckboxes.first().click();

      // Check that it's checked
      await expect(rowCheckboxes.first()).toBeChecked();

      // Bulk action bar should appear
      await expect(page.getByText(/transaktion\(er\) valda/i)).toBeVisible();

      // Uncheck it
      await rowCheckboxes.first().click();
      await expect(rowCheckboxes.first()).not.toBeChecked();
    }
  });

  test('should show bulk categorization bar when transactions selected', async ({ page }) => {
    // Wait for transactions to load
    await page.waitForTimeout(1000);

    const rowCheckboxes = page.locator('tbody input[type="checkbox"]');
    const count = await rowCheckboxes.count();

    if (count > 0) {
      // Select first transaction
      await rowCheckboxes.first().click();

      // Bulk action bar should be visible
      await expect(page.getByText(/transaktion\(er\) valda/i)).toBeVisible();

      // Should have category dropdown
      await expect(page.locator('select').filter({ hasText: /välj kategori/i })).toBeVisible();

      // Should have categorize button
      await expect(page.getByRole('button', { name: /kategorisera valda/i })).toBeVisible();

      // Should have clear selection button
      await expect(page.getByText(/rensa urval/i)).toBeVisible();
    }
  });

  test('should select all transactions with select-all checkbox', async ({ page }) => {
    // Wait for transactions to load
    await page.waitForTimeout(1000);

    const rowCheckboxes = page.locator('tbody input[type="checkbox"]');
    const count = await rowCheckboxes.count();

    if (count > 0) {
      const selectAllCheckbox = page.locator('thead input[type="checkbox"]');

      // Click select all
      await selectAllCheckbox.click();

      // All row checkboxes should be checked
      for (let i = 0; i < count; i++) {
        await expect(rowCheckboxes.nth(i)).toBeChecked();
      }

      // Bulk action bar should show correct count
      await expect(page.getByText(new RegExp(`${count} transaktion\\(er\\) valda`, 'i'))).toBeVisible();

      // Click select all again to deselect
      await selectAllCheckbox.click();

      // All should be unchecked
      for (let i = 0; i < count; i++) {
        await expect(rowCheckboxes.nth(i)).not.toBeChecked();
      }
    }
  });

  test('should clear selection when clicking rensa urval', async ({ page }) => {
    // Wait for transactions to load
    await page.waitForTimeout(1000);

    const rowCheckboxes = page.locator('tbody input[type="checkbox"]');
    const count = await rowCheckboxes.count();

    if (count > 0) {
      // Select first transaction
      await rowCheckboxes.first().click();
      await expect(rowCheckboxes.first()).toBeChecked();

      // Click clear selection
      await page.getByText(/rensa urval/i).click();

      // Checkbox should be unchecked
      await expect(rowCheckboxes.first()).not.toBeChecked();

      // Bulk action bar should disappear
      await expect(page.getByText(/transaktion\(er\) valda/i)).not.toBeVisible();
    }
  });

  test('should highlight selected rows', async ({ page }) => {
    // Wait for transactions to load
    await page.waitForTimeout(1000);

    const rowCheckboxes = page.locator('tbody input[type="checkbox"]');
    const count = await rowCheckboxes.count();

    if (count > 0) {
      const firstRow = page.locator('tbody tr').first();

      // Select first transaction
      await rowCheckboxes.first().click();

      // Row should have blue background class
      const className = await firstRow.getAttribute('class');
      expect(className).toContain('bg-blue-50');
    }
  });

  test('should show period selector', async ({ page }) => {
    // Period selector should be visible
    await expect(page.locator('select').filter({ hasText: /2025|2024/i }).first()).toBeVisible();

    // Navigation buttons should be visible
    await expect(page.locator('button[title*="period"]').first()).toBeVisible();
  });

  test('categorize button should be disabled without category selection', async ({ page }) => {
    // Wait for transactions to load
    await page.waitForTimeout(1000);

    const rowCheckboxes = page.locator('tbody input[type="checkbox"]');
    const count = await rowCheckboxes.count();

    if (count > 0) {
      // Select a transaction
      await rowCheckboxes.first().click();

      // Categorize button should be disabled (no category selected)
      const categorizeButton = page.getByRole('button', { name: /kategorisera valda/i });
      await expect(categorizeButton).toBeDisabled();
    }
  });

  test('should enable categorize button after selecting category', async ({ page }) => {
    // Wait for transactions to load
    await page.waitForTimeout(1000);

    const rowCheckboxes = page.locator('tbody input[type="checkbox"]');
    const count = await rowCheckboxes.count();

    if (count > 0) {
      // Select a transaction
      await rowCheckboxes.first().click();

      // Select a category from dropdown
      const categoryDropdown = page.locator('select').filter({ hasText: /välj kategori/i });
      const options = await categoryDropdown.locator('option').count();

      if (options > 1) {
        // Select the first actual category (skip the placeholder)
        await categoryDropdown.selectOption({ index: 1 });

        // Categorize button should now be enabled
        const categorizeButton = page.getByRole('button', { name: /kategorisera valda/i });
        await expect(categorizeButton).toBeEnabled();
      }
    }
  });
});
