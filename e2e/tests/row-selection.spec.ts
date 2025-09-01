import { test, expect } from '@playwright/test';

test.describe('Row Selection Persistence', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage and URL params before each test
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      window.history.replaceState({}, '', '/');
    });
    await page.reload();
  });

  test('should persist row selection in localStorage', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the table to load
    await expect(page.getByTestId('data-table')).toBeVisible();
    
    // Check initial state - no rows selected
    await expect(page.getByTestId('current-state')).toContain('Selected Rows: 0');
    
    // Select first row
    await page.getByTestId('select-row-0').check();
    await expect(page.getByTestId('current-state')).toContain('Selected Rows: 1');
    
    // Select third row
    await page.getByTestId('select-row-2').check();
    await expect(page.getByTestId('current-state')).toContain('Selected Rows: 2');
    
    // Check localStorage contains the selections
    const selection = await page.evaluate(() => {
      const data = localStorage.getItem('e2e-test-table');
      return data ? JSON.parse(data).selection : null;
    });
    expect(selection).toEqual({ '0': true, '2': true });
    
    // Reload page and verify persistence
    await page.reload();
    await expect(page.getByTestId('select-row-0')).toBeChecked();
    await expect(page.getByTestId('select-row-2')).toBeChecked();
    await expect(page.getByTestId('current-state')).toContain('Selected Rows: 2');
  });

  test('should handle select all functionality', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the table to load
    await expect(page.getByTestId('data-table')).toBeVisible();
    
    // Select all rows on current page
    await page.getByTestId('select-all').check();
    
    // All visible rows should be selected (10 rows on page 1 with default page size)
    await expect(page.getByTestId('current-state')).toContain('Selected Rows: 10');
    
    // Check that all row checkboxes are checked
    for (let i = 0; i < 10; i++) {
      await expect(page.getByTestId(`select-row-${i}`)).toBeChecked();
    }
    
    // Check localStorage contains all selections
    const selection = await page.evaluate(() => {
      const data = localStorage.getItem('e2e-test-table');
      return data ? JSON.parse(data).selection : null;
    });
    
    // Should have 10 entries (0-9)
    expect(Object.keys(selection).length).toBe(10);
    for (let i = 0; i < 10; i++) {
      expect(selection[i.toString()]).toBe(true);
    }
    
    // Reload and verify persistence
    await page.reload();
    await expect(page.getByTestId('select-all')).toBeChecked();
    await expect(page.getByTestId('current-state')).toContain('Selected Rows: 10');
  });

  test('should deselect rows correctly', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the table to load
    await expect(page.getByTestId('data-table')).toBeVisible();
    
    // Select multiple rows
    await page.getByTestId('select-row-0').check();
    await page.getByTestId('select-row-1').check();
    await page.getByTestId('select-row-2').check();
    await expect(page.getByTestId('current-state')).toContain('Selected Rows: 3');
    
    // Deselect middle row
    await page.getByTestId('select-row-1').uncheck();
    await expect(page.getByTestId('current-state')).toContain('Selected Rows: 2');
    
    // Check localStorage is updated
    const selection = await page.evaluate(() => {
      const data = localStorage.getItem('e2e-test-table');
      return data ? JSON.parse(data).selection : null;
    });
    expect(selection).toEqual({ '0': true, '2': true });
    
    // Reload and verify
    await page.reload();
    await expect(page.getByTestId('select-row-0')).toBeChecked();
    await expect(page.getByTestId('select-row-1')).not.toBeChecked();
    await expect(page.getByTestId('select-row-2')).toBeChecked();
    await expect(page.getByTestId('current-state')).toContain('Selected Rows: 2');
  });

  test('should clear all selections', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the table to load
    await expect(page.getByTestId('data-table')).toBeVisible();
    
    // Select multiple rows
    await page.getByTestId('select-row-0').check();
    await page.getByTestId('select-row-1').check();
    await page.getByTestId('select-row-2').check();
    await expect(page.getByTestId('current-state')).toContain('Selected Rows: 3');
    
    // Clear all selections
    await page.getByTestId('clear-selection').click();
    await expect(page.getByTestId('current-state')).toContain('Selected Rows: 0');
    
    // All checkboxes should be unchecked
    await expect(page.getByTestId('select-row-0')).not.toBeChecked();
    await expect(page.getByTestId('select-row-1')).not.toBeChecked();
    await expect(page.getByTestId('select-row-2')).not.toBeChecked();
    await expect(page.getByTestId('select-all')).not.toBeChecked();
    
    // Check localStorage is cleared
    const selection = await page.evaluate(() => {
      const data = localStorage.getItem('e2e-test-table');
      return data ? JSON.parse(data).selection : null;
    });
    expect(selection).toEqual({});
  });

  test('should maintain selections across pagination', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the table to load
    await expect(page.getByTestId('data-table')).toBeVisible();
    
    // Select rows on first page
    await page.getByTestId('select-row-0').check();
    await page.getByTestId('select-row-1').check();
    
    // Go to next page
    await page.getByTestId('next-page').click();
    await expect(page.getByTestId('page-info')).toHaveText('2 of 10');
    
    // Select rows on second page (these will be row indices 10, 11)
    await page.getByTestId('select-row-10').check();
    await page.getByTestId('select-row-11').check();
    
    // Should now have 4 total selected rows
    await expect(page.getByTestId('current-state')).toContain('Selected Rows: 4');
    
    // Go back to first page
    await page.getByTestId('prev-page').click();
    await expect(page.getByTestId('page-info')).toHaveText('1 of 10');
    
    // Previously selected rows should still be selected
    await expect(page.getByTestId('select-row-0')).toBeChecked();
    await expect(page.getByTestId('select-row-1')).toBeChecked();
    await expect(page.getByTestId('current-state')).toContain('Selected Rows: 4');
    
    // Reload and verify selections persist across pages
    await page.reload();
    await expect(page.getByTestId('current-state')).toContain('Selected Rows: 4');
    await expect(page.getByTestId('select-row-0')).toBeChecked();
    await expect(page.getByTestId('select-row-1')).toBeChecked();
    
    // Check second page selections are still there
    await page.getByTestId('next-page').click();
    await expect(page.getByTestId('select-row-10')).toBeChecked();
    await expect(page.getByTestId('select-row-11')).toBeChecked();
  });

  test('should maintain selections with filtering', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the table to load
    await expect(page.getByTestId('data-table')).toBeVisible();
    
    // Select some rows
    await page.getByTestId('select-row-0').check();
    await page.getByTestId('select-row-1').check();
    await page.getByTestId('select-row-2').check();
    await expect(page.getByTestId('current-state')).toContain('Selected Rows: 3');
    
    // Apply a filter
    await page.getByTestId('status-filter').selectOption('active');
    
    // Selected count should be maintained (even if some selected rows are now filtered out)
    // The behavior depends on how the hook handles filtered selections
    // For this test, we'll verify that the selection state is preserved
    await expect(page.getByTestId('current-state')).toContain('Selected Rows: 3');
    
    // Remove filter
    await page.getByTestId('status-filter').selectOption('');
    
    // All selections should still be there
    await expect(page.getByTestId('select-row-0')).toBeChecked();
    await expect(page.getByTestId('select-row-1')).toBeChecked();
    await expect(page.getByTestId('select-row-2')).toBeChecked();
    await expect(page.getByTestId('current-state')).toContain('Selected Rows: 3');
  });

  test('should handle select all with filtering', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the table to load
    await expect(page.getByTestId('data-table')).toBeVisible();
    
    // Apply a filter first
    await page.getByTestId('status-filter').selectOption('active');
    await expect(page.getByTestId('current-state')).toContain('Filtered Rows: 50');
    
    // Select all visible rows (should be 10 active rows on current page)
    await page.getByTestId('select-all').check();
    await expect(page.getByTestId('current-state')).toContain('Selected Rows: 10');
    
    // Remove filter
    await page.getByTestId('status-filter').selectOption('');
    
    // Should still show 10 selected rows, but now we can see all 100 rows
    await expect(page.getByTestId('current-state')).toContain('Selected Rows: 10');
    await expect(page.getByTestId('current-state')).toContain('Filtered Rows: 100');
    
    // The previously selected rows should remain selected
    // (This tests that selection persists across filter changes)
  });

  test('should work with complex state combinations', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the table to load
    await expect(page.getByTestId('data-table')).toBeVisible();
    
    // Apply complex state
    await page.getByTestId('select-row-0').check();
    await page.getByTestId('select-row-5').check();
    await page.getByTestId('status-filter').selectOption('active');
    await page.getByTestId('header-firstName').click(); // Sort
    await page.getByTestId('page-size').selectOption('20');
    await page.getByTestId('global-filter').fill('alice');
    
    // Navigate to see if selections persist
    await page.getByTestId('next-page').click(); // Will reset due to filter change
    
    // Go back to first page
    await page.getByTestId('first-page').click();
    
    // Selections should be maintained
    await expect(page.getByTestId('current-state')).toContain('Selected Rows: 2');
    
    // Reload and verify everything persists
    await page.reload();
    
    await expect(page.getByTestId('current-state')).toContain('Selected Rows: 2');
    await expect(page.getByTestId('status-filter')).toHaveValue('active');
    await expect(page.getByTestId('header-firstName')).toContain('🔼');
    await expect(page.getByTestId('page-size')).toHaveValue('20');
    await expect(page.getByTestId('global-filter')).toHaveValue('alice');
    
    // Check localStorage contains all the state
    const storage = await page.evaluate(() => {
      const data = localStorage.getItem('e2e-test-table');
      return data ? JSON.parse(data) : null;
    });
    
    expect(storage.selection).toEqual({ '0': true, '5': true });
    expect(storage['status-filter']).toBe('active');
    expect(storage.size).toBe(20);
    expect(storage.visibility).toBeDefined();
  });
});