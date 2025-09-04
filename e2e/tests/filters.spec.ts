import { expect, Page, test } from "@playwright/test";

async function waitForDataToLoad(page: Page) {
  // Wait for loading indicator to disappear, indicating data has finished loading
  await expect(page.getByTestId("loading-data")).not.toBeVisible({
    timeout: 10000,
  });
  // Wait for table to be visible
  await expect(page.getByTestId("data-table")).toBeVisible();
}

test.describe("Filters Persistence", () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage and URL params before each test
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.clear();
      window.history.replaceState({}, "", "/");
    });
    await page.reload();
  });

  test("should persist age filter in URL", async ({ page }) => {
    await page.goto("/");

    // Wait for data to finish loading
    await waitForDataToLoad(page);

    // Check initial state
    await expect(page.getByTestId("current-state")).toContainText(
      "Column Filters: 0"
    );

    // Apply age filter
    await page.getByTestId("age-filter").fill("25");
    await page.getByTestId("age-filter").blur();

    // Check URL contains age filter
    expect(page.url()).toContain("test-table.age-filter=25");
    await expect(page.getByTestId("current-state")).toContainText(
      "Column Filters: 1"
    );

    // Reload page and verify persistence
    await page.reload();
    await expect(page.getByTestId("age-filter")).toHaveValue("25");
    await expect(page.getByTestId("current-state")).toContainText(
      "Column Filters: 1"
    );
    expect(page.url()).toContain("test-table.age-filter=25");
  });

  test("should persist status filter in URL", async ({ page }) => {
    await page.goto("/");

    // Wait for data to finish loading
    await waitForDataToLoad(page);

    // Apply status filter
    await page.getByTestId("status-filter").selectOption("active");

    // Check URL contains the filter
    expect(page.url()).toContain("test-table.status-filter=active");

    await expect(page.getByTestId("current-state")).toContainText(
      "Column Filters: 1"
    );

    // Reload page and verify persistence
    await page.reload();
    await expect(page.getByTestId("status-filter")).toHaveValue("active");
    await expect(page.getByTestId("current-state")).toContainText(
      "Column Filters: 1"
    );
  });

  test("should persist global filter in URL", async ({ page }) => {
    await page.goto("/");

    // Wait for data to finish loading
    await waitForDataToLoad(page);

    // Apply global filter
    await page.getByTestId("global-filter").fill("john");
    await page.getByTestId("global-filter").blur();

    // Check URL contains global filter
    expect(page.url()).toContain("test-table.search=john");
    await expect(page.getByTestId("current-state")).toContainText(
      "Global Filter: john"
    );

    // Reload page and verify persistence
    await page.reload();
    await expect(page.getByTestId("global-filter")).toHaveValue("john");
    await expect(page.getByTestId("current-state")).toContainText(
      "Global Filter: john"
    );
    expect(page.url()).toContain("test-table.search=john");
  });

  test("should filter data correctly", async ({ page }) => {
    await page.goto("/");

    // Wait for data to finish loading
    await waitForDataToLoad(page);

    // Get initial row count
    const initialRows = await page.getByTestId("current-state").textContent();
    expect(initialRows).toContain("Column Filters: 0");

    // Apply status filter to 'active'
    await page.getByTestId("status-filter").selectOption("active");

    // Should show 50 rows (every other user is active)
    await expect(page.getByTestId("current-state")).toContainText(
      "Column Filters: 1"
    );
    await expect(page.getByTestId("current-state")).toContainText(
      `Column Filters: [ { "id": "status", "value": "active" } ]`
    );

    // All visible rows should have 'active' status
    const statusCells = page.locator('[data-testid^="cell-status-"]');
    const count = await statusCells.count();

    for (let i = 0; i < Math.min(count, 10); i++) {
      // Check first 10 visible rows
      await expect(statusCells.nth(i)).toHaveText("active");
    }
  });

  test("should handle multiple filters simultaneously", async ({ page }) => {
    await page.goto("/");

    // Wait for data to finish loading
    await waitForDataToLoad(page);

    // Apply multiple filters
    await page.getByTestId("status-filter").selectOption("active");
    await page.getByTestId("age-filter").fill("25");
    await page.getByTestId("global-filter").fill("john");

    // Check all filters are applied
    await expect(page.getByTestId("current-state")).toContainText(
      "Column Filters: 2"
    );
    await expect(page.getByTestId("current-state")).toContainText(
      "Global Filter: john"
    );

    // Check URL contains URL-persisted filters
    expect(page.url()).toContain("test-table.age-filter=25");
    expect(page.url()).toContain("test-table.search=john");
    expect(page.url()).toContain("test-table.status-filter=active");

    // Reload and verify all filters persist
    await page.reload();
    await expect(page.getByTestId("status-filter")).toHaveValue("active");
    await expect(page.getByTestId("age-filter")).toHaveValue("25");
    await expect(page.getByTestId("global-filter")).toHaveValue("john");
    await expect(page.getByTestId("current-state")).toContainText(
      "Column Filters: 2"
    );
    await expect(page.getByTestId("current-state")).toContainText(
      "Global Filter: john"
    );
  });

  test("should reset pagination when filters change", async ({ page }) => {
    await page.goto("/");

    // Wait for data to finish loading
    await waitForDataToLoad(page);

    // Navigate to page 3
    await page.getByTestId("goto-page").fill("3");
    await page.getByTestId("goto-page").press("Enter");
    await expect(page.getByTestId("page-info")).toHaveText("3 of 100");

    // Apply a filter
    await page.getByTestId("status-filter").selectOption("active");

    // Should reset to page 1
    await expect(page.getByTestId("page-info")).toHaveText("1 of 34");
    expect(page.url()).toContain("test-table.page=0");
  });

  test("should clear filters correctly", async ({ page }) => {
    await page.goto("/");

    // Wait for data to finish loading
    await waitForDataToLoad(page);

    // Apply filters
    await page.getByTestId("status-filter").selectOption("active");
    await page.getByTestId("age-filter").fill("30");
    await page.getByTestId("global-filter").fill("alice");

    // Verify filters are applied
    await expect(page.getByTestId("current-state")).toContainText(
      "Column Filters: 2"
    );
    await expect(page.getByTestId("current-state")).toContainText(
      "Global Filter: alice"
    );

    // Clear filters one by one
    await page.getByTestId("global-filter").clear();
    await expect(page.getByTestId("current-state")).toContainText(
      "Global Filter: None"
    );
    expect(page.url()).not.toContain("test-table.search");

    await page.getByTestId("age-filter").clear();
    await expect(page.getByTestId("current-state")).toContainText(
      "Column Filters: 1"
    );
    expect(page.url()).not.toContain("test-table.age-filter");

    await page.getByTestId("status-filter").selectOption("");
    await expect(page.getByTestId("current-state")).toContainText(
      "Column Filters: 0"
    );

    // Check URL is cleared (status filter is now in URL)
    expect(page.url()).not.toContain("test-table.status-filter");
  });

  test("should handle async filter processing", async ({ page }) => {
    await page.goto("/");

    // Wait for data to finish loading
    await waitForDataToLoad(page);

    // Check that async filter processing is complete
    await expect(page.getByTestId("loading-filters")).not.toBeVisible();

    // Apply a filter that might trigger async processing
    await page.getByTestId("age-filter").fill("25");

    // The loading indicator might appear briefly but should disappear
    // We can't reliably test for its appearance due to timing, but we can ensure it's gone
    await page.waitForTimeout(100);
    await expect(page.getByTestId("loading-filters")).not.toBeVisible();
  });

  test("should maintain filters with sorting and pagination", async ({
    page,
  }) => {
    await page.goto("/");

    // Wait for data to finish loading
    await waitForDataToLoad(page);

    // Apply complex state
    await page.getByTestId("status-filter").selectOption("active");
    await page.getByTestId("global-filter").fill("alice");
    await page.getByTestId("header-age").click(); // Sort by age
    await page.getByTestId("next-page").click();

    // Reload and verify everything persists
    await page.reload();

    await expect(page.getByTestId("status-filter")).toHaveValue("active");
    await expect(page.getByTestId("global-filter")).toHaveValue("alice");
    await expect(page.getByTestId("header-age")).toContainText("Age 🔽");

    // Verify URL contains all relevant parameters
    expect(page.url()).toContain("test-table.search=alice");
    expect(page.url()).toContain("test-table.status-filter=active");
    expect(page.url()).toContain("test-table.sort-col=age");
    expect(page.url()).toContain("test-table.page=1");
  });
});
