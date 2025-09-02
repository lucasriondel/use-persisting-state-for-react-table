import { test, expect } from '@playwright/test';

test.describe('Integration Tests - Full Hook Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage and URL params before each test
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      window.history.replaceState({}, '', '/');
    });
    await page.reload();
  });

  test('should handle complete workflow with all features', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the table to load and async filters to complete
    await expect(page.getByTestId('data-table')).toBeVisible();
    await expect(page.getByTestId('loading-filters')).not.toBeVisible();
    
    // Step 1: Apply filters
    await page.getByTestId('global-filter').fill('john');
    await page.getByTestId('status-filter').selectOption('active');
    await page.getByTestId('age-filter').fill('25');
    
    // Verify filters applied
    await expect(page.getByTestId('current-state')).toContainText('Global Filter: john');
    await expect(page.getByTestId('current-state')).toContainText('Column Filters: 2');
    
    // Step 2: Sort data
    await page.getByTestId('header-firstName').click();
    await expect(page.getByTestId('header-firstName')).toContainText('🔼');
    await expect(page.getByTestId('current-state')).toContainText('Sorting: firstName (asc)');
    
    // Step 3: Hide a column
    await page.getByTestId('toggle-email-column').click();
    await expect(page.getByTestId('header-email')).not.toBeVisible();
    
    // Step 4: Select rows
    await page.getByTestId('select-row-0').check();
    await page.getByTestId('select-row-1').check();
    await expect(page.getByTestId('current-state')).toContainText('Selected Rows: 2');
    
    // Step 5: Change pagination
    await page.getByTestId('page-size').selectOption('20');
    await expect(page.getByTestId('page-size')).toHaveValue('20');
    
    // Step 6: Navigate pages
    if (await page.getByTestId('next-page').isEnabled()) {
      await page.getByTestId('next-page').click();
      await expect(page.getByTestId('page-info')).toContainText('2 of');
    }
    
    // Verify URL contains relevant parameters
    expect(page.url()).toContain('test-table.search=john');
    expect(page.url()).toContain('test-table.age-filter=25');
    expect(page.url()).toContain('test-table.sort-col=firstName');
    expect(page.url()).toContain('test-table.sort-dir=asc');
    
    // Verify localStorage contains relevant data
    const localStorage = await page.evaluate(() => {
      const data = window.localStorage.getItem('e2e-test-table');
      return data ? JSON.parse(data) : null;
    });
    
    // Status filter is now in URL, not localStorage
    expect(localStorage.size).toBe(20);
    expect(localStorage.visibility).toEqual({ email: false });
    expect(localStorage.selection).toEqual({ '0': true, '1': true });
    
    // Step 7: Store localStorage and reload page to verify complete state persistence
    const storageState = await page.evaluate(() => {
      return localStorage.getItem('e2e-test-table');
    });
    
    await page.reload();
    await page.evaluate((storage) => {
      if (storage) {
        localStorage.setItem('e2e-test-table', storage);
      }
    }, storageState);
    await page.reload(); // Second reload to ensure localStorage is loaded
    
    // Verify all state is restored
    await expect(page.getByTestId('global-filter')).toHaveValue('john');
    await expect(page.getByTestId('status-filter')).toHaveValue('active');
    await expect(page.getByTestId('age-filter')).toHaveValue('25');
    await expect(page.getByTestId('header-firstName')).toContainText('🔼');
    await expect(page.getByTestId('header-email')).not.toBeVisible();
    await expect(page.getByTestId('select-row-0')).toBeChecked();
    await expect(page.getByTestId('select-row-1')).toBeChecked();
    await expect(page.getByTestId('page-size')).toHaveValue('20');
    
    // Verify computed state
    await expect(page.getByTestId('current-state')).toContainText('Global Filter: john');
    await expect(page.getByTestId('current-state')).toContainText('Column Filters: 2');
    await expect(page.getByTestId('current-state')).toContainText('Sorting: firstName (asc)');
    await expect(page.getByTestId('current-state')).toContainText('Selected Rows: 2');
  });

  test('should handle edge cases and error scenarios', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('data-table')).toBeVisible();
    
    // Test invalid page numbers
    await page.getByTestId('goto-page').fill('999');
    await page.getByTestId('goto-page').press('Enter');
    
    // Should handle gracefully (clamp to valid range)
    const pageInfo = await page.getByTestId('page-info').textContent();
    expect(pageInfo).toMatch(/\d+ of \d+/);
    
    // Test empty filter values
    await page.getByTestId('age-filter').fill('');
    await page.getByTestId('age-filter').blur();
    
    // Should clear the filter
    expect(page.url()).not.toContain('test-table.age-filter');
    
    // Test very large numbers
    await page.getByTestId('age-filter').fill('999');
    await page.getByTestId('age-filter').blur();
    
    // Should handle gracefully (likely no results)
    await expect(page.getByTestId('current-state')).toContainText('Filtered Rows: 0');
    
    // Clear filter and verify recovery
    await page.getByTestId('age-filter').clear();
    await page.getByTestId('age-filter').blur();
    await expect(page.getByTestId('current-state')).toContainText('Filtered Rows: 100');
  });

  test('should handle multiple browser tabs with same URL namespace', async ({ context }) => {
    // Create first tab
    const page1 = await context.newPage();
    await page1.goto('/');
    await expect(page1.getByTestId('data-table')).toBeVisible();
    
    // Apply some state in first tab
    await page1.getByTestId('global-filter').fill('alice');
    await page1.getByTestId('status-filter').selectOption('active');
    await page1.getByTestId('header-age').click();
    
    // Create second tab and navigate to same URL
    const page2 = await context.newPage();
    await page2.goto(page1.url());
    await expect(page2.getByTestId('data-table')).toBeVisible();
    
    // Second tab should inherit the state from URL
    await expect(page2.getByTestId('global-filter')).toHaveValue('alice');
    await expect(page2.getByTestId('header-age')).toContainText('🔼');
    
    // But localStorage state might be different (status filter)
    // This tests the mixed persistence strategy
    await expect(page2.getByTestId('status-filter')).toHaveValue('active');
    
    // Make changes in second tab
    await page2.getByTestId('page-size').selectOption('20');
    await page2.getByTestId('select-row-0').check();
    
    // Switch back to first tab and store localStorage
    await page1.bringToFront();
    const storageState = await page1.evaluate(() => {
      return localStorage.getItem('e2e-test-table');
    });
    
    await page1.reload();
    await page1.evaluate((storage) => {
      if (storage) {
        localStorage.setItem('e2e-test-table', storage);
      }
    }, storageState);
    await page1.reload(); // Second reload to ensure localStorage is loaded
    
    // localStorage changes should be reflected
    await expect(page1.getByTestId('page-size')).toHaveValue('20');
    await expect(page1.getByTestId('select-row-0')).toBeChecked();
    
    await page1.close();
    await page2.close();
  });

  test('should handle localStorage corruption gracefully', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('data-table')).toBeVisible();
    
    // Corrupt localStorage with invalid JSON
    await page.evaluate(() => {
      localStorage.setItem('e2e-test-table', 'invalid-json{');
    });
    
    // Reload page
    await page.reload();
    
    // Should handle gracefully and start with default state
    await expect(page.getByTestId('data-table')).toBeVisible();
    await expect(page.getByTestId('current-state')).toContainText('Selected Rows: 0');
    await expect(page.getByTestId('current-state')).toContainText('Column Filters: 0');
    
    // Should be able to continue working normally
    await page.getByTestId('status-filter').selectOption('active');
    await expect(page.getByTestId('current-state')).toContainText('Column Filters: 1');
  });

  test('should handle URL parameter conflicts', async ({ page }) => {
    // Navigate with conflicting parameters
    await page.goto('/?test-table.page=5&test-table.page=3&test-table.sort-col=age&test-table.sort-col=name');
    await expect(page.getByTestId('data-table')).toBeVisible();
    
    // Should handle gracefully (likely use the last value or first valid value)
    const pageInfo = await page.getByTestId('page-info').textContent();
    expect(pageInfo).toMatch(/\d+ of \d+/);
    
    // Table should be functional
    await page.getByTestId('status-filter').selectOption('active');
    await expect(page.getByTestId('current-state')).toContainText('Filtered Rows: 50');
  });

  test('should maintain performance with large datasets', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('data-table')).toBeVisible();
    
    // Start measuring time for operations
    const startTime = Date.now();
    
    // Perform multiple operations quickly
    await page.getByTestId('global-filter').fill('test-search');
    await page.getByTestId('status-filter').selectOption('active');
    await page.getByTestId('age-filter').fill('30');
    await page.getByTestId('header-firstName').click();
    await page.getByTestId('page-size').selectOption('50');
    
    // Select multiple rows
    for (let i = 0; i < 5; i++) {
      await page.getByTestId(`select-row-${i}`).check();
    }
    
    const endTime = Date.now();
    const operationTime = endTime - startTime;
    
    // Operations should complete in reasonable time (less than 5 seconds)
    expect(operationTime).toBeLessThan(5000);
    
    // Verify all operations completed successfully
    await expect(page.getByTestId('current-state')).toContainText('Selected Rows: 5');
    await expect(page.getByTestId('current-state')).toContainText('Column Filters: 2');
    await expect(page.getByTestId('current-state')).toContainText('Global Filter: test-search');
  });

  test('should handle rapid state changes without conflicts', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('data-table')).toBeVisible();
    
    // Rapidly change multiple states
    await Promise.all([
      page.getByTestId('global-filter').fill('rapid-test'),
      page.getByTestId('age-filter').fill('25'),
      page.getByTestId('status-filter').selectOption('active'),
    ]);
    
    // Click sort multiple times rapidly
    for (let i = 0; i < 3; i++) {
      await page.getByTestId('header-firstName').click();
      await page.waitForTimeout(50);
    }
    
    // Change page size and navigate rapidly
    await page.getByTestId('page-size').selectOption('20');
    await page.getByTestId('next-page').click();
    await page.getByTestId('prev-page').click();
    
    // Final state should be consistent
    await expect(page.getByTestId('global-filter')).toHaveValue('rapid-test');
    await expect(page.getByTestId('age-filter')).toHaveValue('25');
    await expect(page.getByTestId('status-filter')).toHaveValue('active');
    await expect(page.getByTestId('page-size')).toHaveValue('20');
    
    // Should still be functional after rapid changes
    await page.getByTestId('select-row-0').check();
    await expect(page.getByTestId('current-state')).toContainText('Selected Rows: 1');
    
    // Store localStorage and reload to verify persistence survived rapid changes
    const storageState = await page.evaluate(() => {
      return localStorage.getItem('e2e-test-table');
    });
    
    await page.reload();
    await page.evaluate((storage) => {
      if (storage) {
        localStorage.setItem('e2e-test-table', storage);
      }
    }, storageState);
    await page.reload(); // Second reload to ensure localStorage is loaded
    
    await expect(page.getByTestId('global-filter')).toHaveValue('rapid-test');
    await expect(page.getByTestId('status-filter')).toHaveValue('active');
    await expect(page.getByTestId('select-row-0')).toBeChecked();
  });
});