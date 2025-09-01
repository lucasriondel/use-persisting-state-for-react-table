import { test, expect } from '@playwright/test';

test.describe('Pagination Persistence', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage and URL params before each test
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      window.history.replaceState({}, '', '/');
    });
    await page.reload();
  });

  test('should persist page index in URL', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the table to load
    await expect(page.getByTestId('data-table')).toBeVisible();
    
    // Check initial state - should be on page 1
    await expect(page.getByTestId('page-info')).toHaveText('1 of 10');
    
    // Navigate to page 3
    await page.getByTestId('goto-page').fill('3');
    await page.getByTestId('goto-page').press('Enter');
    
    // Check URL contains page parameter
    expect(page.url()).toContain('test-table.page=2'); // 0-indexed
    await expect(page.getByTestId('page-info')).toHaveText('3 of 10');
    
    // Reload page and verify persistence
    await page.reload();
    await expect(page.getByTestId('page-info')).toHaveText('3 of 10');
    expect(page.url()).toContain('test-table.page=2');
  });

  test('should persist page size in localStorage', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the table to load
    await expect(page.getByTestId('data-table')).toBeVisible();
    
    // Check initial page size
    await expect(page.getByTestId('page-size')).toHaveValue('10');
    
    // Change page size to 20
    await page.getByTestId('page-size').selectOption('20');
    
    // Check localStorage contains the page size
    const pageSize = await page.evaluate(() => {
      const data = localStorage.getItem('e2e-test-table');
      return data ? JSON.parse(data).size : null;
    });
    expect(pageSize).toBe(20);
    
    // Reload page and verify persistence
    await page.reload();
    await expect(page.getByTestId('page-size')).toHaveValue('20');
    await expect(page.getByTestId('page-info')).toContain('of 5'); // 100 items / 20 per page = 5 pages
  });

  test('should navigate through pages correctly', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the table to load
    await expect(page.getByTestId('data-table')).toBeVisible();
    
    // Test next page navigation
    await page.getByTestId('next-page').click();
    await expect(page.getByTestId('page-info')).toHaveText('2 of 10');
    expect(page.url()).toContain('test-table.page=1');
    
    // Test previous page navigation
    await page.getByTestId('prev-page').click();
    await expect(page.getByTestId('page-info')).toHaveText('1 of 10');
    expect(page.url()).toContain('test-table.page=0');
    
    // Test first page button
    await page.getByTestId('goto-page').fill('5');
    await page.getByTestId('goto-page').press('Enter');
    await page.getByTestId('first-page').click();
    await expect(page.getByTestId('page-info')).toHaveText('1 of 10');
    
    // Test last page button
    await page.getByTestId('last-page').click();
    await expect(page.getByTestId('page-info')).toHaveText('10 of 10');
  });

  test('should reset pagination correctly', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the table to load
    await expect(page.getByTestId('data-table')).toBeVisible();
    
    // Navigate to a different page and change page size
    await page.getByTestId('page-size').selectOption('20');
    await page.getByTestId('goto-page').fill('3');
    await page.getByTestId('goto-page').press('Enter');
    
    await expect(page.getByTestId('page-info')).toHaveText('3 of 5');
    
    // Reset pagination
    await page.getByTestId('reset-pagination').click();
    
    // Should go back to first page but keep the page size
    await expect(page.getByTestId('page-info')).toHaveText('1 of 5');
    await expect(page.getByTestId('page-size')).toHaveValue('20');
    expect(page.url()).toContain('test-table.page=0');
  });

  test('should handle pagination with filtering', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the table to load
    await expect(page.getByTestId('data-table')).toBeVisible();
    
    // Apply a filter that reduces results
    await page.getByTestId('status-filter').selectOption('active');
    
    // Should automatically reset to first page
    await expect(page.getByTestId('page-info')).toHaveText('1 of 5'); // 50 active users / 10 per page = 5 pages
    expect(page.url()).toContain('test-table.page=0');
    
    // Navigate to page 3
    await page.getByTestId('goto-page').fill('3');
    await page.getByTestId('goto-page').press('Enter');
    await expect(page.getByTestId('page-info')).toHaveText('3 of 5');
    
    // Remove filter - should stay on same page if possible
    await page.getByTestId('status-filter').selectOption('');
    await expect(page.getByTestId('page-info')).toHaveText('1 of 10'); // Reset due to automaticPageReset
  });
});