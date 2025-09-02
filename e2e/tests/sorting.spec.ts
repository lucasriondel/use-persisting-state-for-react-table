import { test, expect } from '@playwright/test';

test.describe('Sorting Persistence', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage and URL params before each test
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      window.history.replaceState({}, '', '/');
    });
    await page.reload();
  });

  test('should persist sorting in URL', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the table to load
    await expect(page.getByTestId('data-table')).toBeVisible();
    
    // Check initial state - no sorting
    await expect(page.getByTestId('current-state')).toContainText('Sorting: None');
    
    // Click on firstName column to sort
    await page.getByTestId('header-firstName').click();
    
    // Check URL contains sorting parameters
    expect(page.url()).toContain('test-table.sort-col=firstName');
    expect(page.url()).toContain('test-table.sort-dir=asc');
    
    // Check visual indicator
    await expect(page.getByTestId('header-firstName')).toContainText('🔼');
    await expect(page.getByTestId('current-state')).toContainText('Sorting: firstName (asc)');
    
    // Click again to reverse sort
    await page.getByTestId('header-firstName').click();
    
    expect(page.url()).toContain('test-table.sort-col=firstName');
    expect(page.url()).toContain('test-table.sort-dir=desc');
    await expect(page.getByTestId('header-firstName')).toContainText('🔽');
    await expect(page.getByTestId('current-state')).toContainText('Sorting: firstName (desc)');
    
    // Reload page and verify persistence
    await page.reload();
    await expect(page.getByTestId('header-firstName')).toContainText('🔽');
    await expect(page.getByTestId('current-state')).toContainText('Sorting: firstName (desc)');
    expect(page.url()).toContain('test-table.sort-col=firstName');
    expect(page.url()).toContain('test-table.sort-dir=desc');
  });

  test('should clear sorting when clicking sorted column third time', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the table to load
    await expect(page.getByTestId('data-table')).toBeVisible();
    
    // Sort ascending
    await page.getByTestId('header-age').click();
    await expect(page.getByTestId('header-age')).toContainText('🔼');
    expect(page.url()).toContain('test-table.sort-col=age');
    
    // Sort descending
    await page.getByTestId('header-age').click();
    await expect(page.getByTestId('header-age')).toContainText('🔽');
    
    // Clear sorting
    await page.getByTestId('header-age').click();
    await expect(page.getByTestId('header-age')).not.toContainText('🔼');
    await expect(page.getByTestId('header-age')).not.toContainText('🔽');
    await expect(page.getByTestId('current-state')).toContainText('Sorting: None');
    
    // URL should not contain sorting params
    expect(page.url()).not.toContain('test-table.sort-col');
    expect(page.url()).not.toContain('test-table.sort-dir');
  });

  test('should switch sorting between columns', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the table to load
    await expect(page.getByTestId('data-table')).toBeVisible();
    
    // Sort by firstName
    await page.getByTestId('header-firstName').click();
    await expect(page.getByTestId('current-state')).toContainText('Sorting: firstName (asc)');
    
    // Sort by age - should replace firstName sorting
    await page.getByTestId('header-age').click();
    await expect(page.getByTestId('current-state')).toContainText('Sorting: age (asc)');
    await expect(page.getByTestId('header-firstName')).not.toContainText('🔼');
    await expect(page.getByTestId('header-age')).toContainText('🔼');
    
    // URL should reflect the new sorting
    expect(page.url()).toContain('test-table.sort-col=age');
    expect(page.url()).not.toContain('firstName');
  });

  test('should sort data correctly', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the table to load
    await expect(page.getByTestId('data-table')).toBeVisible();
    
    // Get first row data before sorting
    const firstRowBeforeSort = await page.getByTestId('cell-firstName-0').textContent();
    
    // Sort by firstName ascending
    await page.getByTestId('header-firstName').click();
    
    // Wait for sorting to apply
    await page.waitForTimeout(100);
    
    // Get first row data after sorting
    const firstRowAfterSort = await page.getByTestId('cell-firstName-0').textContent();
    
    // Should be different (unless it was already sorted)
    // In our test data, names cycle through John, Jane, Bob, Alice, Charlie
    // So sorted ascending should start with Alice
    await expect(page.getByTestId('cell-firstName-0')).toHaveText('Alice');
    
    // Sort descending and check
    await page.getByTestId('header-firstName').click();
    await page.waitForTimeout(100);
    
    // Should now start with John (highest alphabetically in our dataset)
    await expect(page.getByTestId('cell-firstName-0')).toHaveText('John');
  });

  test('should maintain sorting when filtering', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the table to load
    await expect(page.getByTestId('data-table')).toBeVisible();
    
    // Sort by age ascending
    await page.getByTestId('header-age').click();
    await expect(page.getByTestId('current-state')).toContainText('Sorting: age (asc)');
    
    // Apply a filter
    await page.getByTestId('status-filter').selectOption('active');
    
    // Sorting should be maintained
    await expect(page.getByTestId('current-state')).toContainText('Sorting: age (asc)');
    await expect(page.getByTestId('header-age')).toContainText('🔼');
    
    // URL should still contain sorting params
    expect(page.url()).toContain('test-table.sort-col=age');
    expect(page.url()).toContain('test-table.sort-dir=asc');
  });

  test('should handle sorting persistence after page reload', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the table to load
    await expect(page.getByTestId('data-table')).toBeVisible();
    
    // Apply multiple operations
    await page.getByTestId('header-lastName').click(); // Sort by lastName
    await page.getByTestId('next-page').click(); // Go to page 2
    await page.getByTestId('status-filter').selectOption('inactive'); // Filter
    
    // Check state before reload
    await expect(page.getByTestId('current-state')).toContainText('Sorting: lastName (asc)');
    await expect(page.getByTestId('header-lastName')).toContainText('🔼');
    
    // Reload page
    await page.reload();
    
    // All state should be restored
    await expect(page.getByTestId('current-state')).toContainText('Sorting: lastName (asc)');
    await expect(page.getByTestId('header-lastName')).toContainText('🔼');
    await expect(page.getByTestId('status-filter')).toHaveValue('inactive');
    await expect(page.getByTestId('page-info')).toContainText('1 of'); // Page reset due to filter
  });
});