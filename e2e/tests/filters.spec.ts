import { test, expect } from '@playwright/test';

test.describe('Filters Persistence', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage and URL params before each test
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      window.history.replaceState({}, '', '/');
    });
    await page.reload();
  });

  test('should persist age filter in URL', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the table to load
    await expect(page.getByTestId('data-table')).toBeVisible();
    
    // Check initial state
    await expect(page.getByTestId('current-state')).toContain('Column Filters: 0');
    
    // Apply age filter
    await page.getByTestId('age-filter').fill('25');
    await page.getByTestId('age-filter').blur();
    
    // Check URL contains age filter
    expect(page.url()).toContain('test-table-age-filter=25');
    await expect(page.getByTestId('current-state')).toContain('Column Filters: 1');
    
    // Reload page and verify persistence
    await page.reload();
    await expect(page.getByTestId('age-filter')).toHaveValue('25');
    await expect(page.getByTestId('current-state')).toContain('Column Filters: 1');
    expect(page.url()).toContain('test-table-age-filter=25');
  });

  test('should persist status filter in localStorage', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the table to load
    await expect(page.getByTestId('data-table')).toBeVisible();
    
    // Apply status filter
    await page.getByTestId('status-filter').selectOption('active');
    
    // Check localStorage contains the filter
    const statusFilter = await page.evaluate(() => {
      const data = localStorage.getItem('e2e-test-table');
      return data ? JSON.parse(data)['status-filter'] : null;
    });
    expect(statusFilter).toBe('active');
    
    await expect(page.getByTestId('current-state')).toContain('Column Filters: 1');
    
    // Reload page and verify persistence
    await page.reload();
    await expect(page.getByTestId('status-filter')).toHaveValue('active');
    await expect(page.getByTestId('current-state')).toContain('Column Filters: 1');
  });

  test('should persist global filter in URL', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the table to load
    await expect(page.getByTestId('data-table')).toBeVisible();
    
    // Apply global filter
    await page.getByTestId('global-filter').fill('john');
    await page.getByTestId('global-filter').blur();
    
    // Check URL contains global filter
    expect(page.url()).toContain('test-table-search=john');
    await expect(page.getByTestId('current-state')).toContain('Global Filter: john');
    
    // Reload page and verify persistence
    await page.reload();
    await expect(page.getByTestId('global-filter')).toHaveValue('john');
    await expect(page.getByTestId('current-state')).toContain('Global Filter: john');
    expect(page.url()).toContain('test-table-search=john');
  });

  test('should filter data correctly', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the table to load
    await expect(page.getByTestId('data-table')).toBeVisible();
    
    // Get initial row count
    const initialRows = await page.getByTestId('current-state').textContent();
    expect(initialRows).toContain('Filtered Rows: 100');
    
    // Apply status filter to 'active'
    await page.getByTestId('status-filter').selectOption('active');
    
    // Should show 50 rows (every other user is active)
    await expect(page.getByTestId('current-state')).toContain('Filtered Rows: 50');
    
    // All visible rows should have 'active' status
    const statusCells = page.locator('[data-testid^="cell-status-"]');
    const count = await statusCells.count();
    
    for (let i = 0; i < Math.min(count, 10); i++) { // Check first 10 visible rows
      await expect(statusCells.nth(i)).toHaveText('active');
    }
  });

  test('should handle multiple filters simultaneously', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the table to load
    await expect(page.getByTestId('data-table')).toBeVisible();
    
    // Apply multiple filters
    await page.getByTestId('status-filter').selectOption('active');
    await page.getByTestId('age-filter').fill('25');
    await page.getByTestId('global-filter').fill('john');
    
    // Check all filters are applied
    await expect(page.getByTestId('current-state')).toContain('Column Filters: 2');
    await expect(page.getByTestId('current-state')).toContain('Global Filter: john');
    
    // Check URL and localStorage
    expect(page.url()).toContain('test-table-age-filter=25');
    expect(page.url()).toContain('test-table-search=john');
    
    const statusFilter = await page.evaluate(() => {
      const data = localStorage.getItem('e2e-test-table');
      return data ? JSON.parse(data)['status-filter'] : null;
    });
    expect(statusFilter).toBe('active');
    
    // Reload and verify all filters persist
    await page.reload();
    await expect(page.getByTestId('status-filter')).toHaveValue('active');
    await expect(page.getByTestId('age-filter')).toHaveValue('25');
    await expect(page.getByTestId('global-filter')).toHaveValue('john');
    await expect(page.getByTestId('current-state')).toContain('Column Filters: 2');
    await expect(page.getByTestId('current-state')).toContain('Global Filter: john');
  });

  test('should reset pagination when filters change', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the table to load
    await expect(page.getByTestId('data-table')).toBeVisible();
    
    // Navigate to page 3
    await page.getByTestId('goto-page').fill('3');
    await page.getByTestId('goto-page').press('Enter');
    await expect(page.getByTestId('page-info')).toHaveText('3 of 10');
    
    // Apply a filter
    await page.getByTestId('status-filter').selectOption('active');
    
    // Should reset to page 1
    await expect(page.getByTestId('page-info')).toHaveText('1 of 5');
    expect(page.url()).toContain('test-table-page=0');
  });

  test('should clear filters correctly', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the table to load
    await expect(page.getByTestId('data-table')).toBeVisible();
    
    // Apply filters
    await page.getByTestId('status-filter').selectOption('active');
    await page.getByTestId('age-filter').fill('30');
    await page.getByTestId('global-filter').fill('alice');
    
    // Verify filters are applied
    await expect(page.getByTestId('current-state')).toContain('Column Filters: 2');
    await expect(page.getByTestId('current-state')).toContain('Global Filter: alice');
    
    // Clear filters one by one
    await page.getByTestId('global-filter').clear();
    await expect(page.getByTestId('current-state')).toContain('Global Filter: None');
    expect(page.url()).not.toContain('test-table-search');
    
    await page.getByTestId('age-filter').clear();
    await expect(page.getByTestId('current-state')).toContain('Column Filters: 1');
    expect(page.url()).not.toContain('test-table-age-filter');
    
    await page.getByTestId('status-filter').selectOption('');
    await expect(page.getByTestId('current-state')).toContain('Column Filters: 0');
    
    // Check localStorage is cleared
    const statusFilter = await page.evaluate(() => {
      const data = localStorage.getItem('e2e-test-table');
      return data ? JSON.parse(data)['status-filter'] : null;
    });
    expect(statusFilter).toBeNull();
  });

  test('should handle async filter processing', async ({ page }) => {
    await page.goto('/');
    
    // Wait for initial loading to complete
    await expect(page.getByTestId('data-table')).toBeVisible();
    
    // Check that async filter processing is complete
    await expect(page.getByTestId('loading-filters')).not.toBeVisible();
    
    // Apply a filter that might trigger async processing
    await page.getByTestId('age-filter').fill('25');
    
    // The loading indicator might appear briefly but should disappear
    // We can't reliably test for its appearance due to timing, but we can ensure it's gone
    await page.waitForTimeout(100);
    await expect(page.getByTestId('loading-filters')).not.toBeVisible();
  });

  test('should maintain filters with sorting and pagination', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the table to load
    await expect(page.getByTestId('data-table')).toBeVisible();
    
    // Apply complex state
    await page.getByTestId('status-filter').selectOption('active');
    await page.getByTestId('global-filter').fill('alice');
    await page.getByTestId('header-age').click(); // Sort by age
    await page.getByTestId('next-page').click(); // Go to page 2 (will reset due to filter)
    
    // Reload and verify everything persists
    await page.reload();
    
    await expect(page.getByTestId('status-filter')).toHaveValue('active');
    await expect(page.getByTestId('global-filter')).toHaveValue('alice');
    await expect(page.getByTestId('header-age')).toContain('🔼');
    
    // Verify URL contains all relevant parameters
    expect(page.url()).toContain('test-table-search=alice');
    expect(page.url()).toContain('test-table-sort-col=age');
    expect(page.url()).toContain('test-table-page=0'); // Reset to first page
  });
});