import { expect, test } from "@playwright/test";
import { waitForDataToLoad } from "./helpers";

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
    await page.getByTestId("age").fill("25");
    await page.getByTestId("age").blur();

    // Check URL contains age filter
    expect(page.url()).toContain("test-table.age=25");
    await expect(page.getByTestId("current-state")).toContainText(
      "Column Filters: 1"
    );

    // Reload page and verify persistence
    await page.reload();
    await expect(page.getByTestId("age")).toHaveValue("25");
    await expect(page.getByTestId("current-state")).toContainText(
      "Column Filters: 1"
    );
    expect(page.url()).toContain("test-table.age=25");
  });

  test("should persist status filter in URL", async ({ page }) => {
    await page.goto("/");

    // Wait for data to finish loading
    await waitForDataToLoad(page);

    // Apply status filter
    await page.getByTestId("status").selectOption("active");

    // Check URL contains the filter
    expect(page.url()).toContain("test-table.status=active");

    await expect(page.getByTestId("current-state")).toContainText(
      "Column Filters: 1"
    );

    // Reload page and verify persistence
    await page.reload();
    await expect(page.getByTestId("status")).toHaveValue("active");
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
    await page.getByTestId("status").selectOption("active");

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
    await page.getByTestId("status").selectOption("active");
    await page.getByTestId("age").fill("25");
    await page.getByTestId("global-filter").fill("john");

    // Check all filters are applied
    await expect(page.getByTestId("current-state")).toContainText(
      "Column Filters: 2"
    );
    await expect(page.getByTestId("current-state")).toContainText(
      "Global Filter: john"
    );

    // Check URL contains URL-persisted filters
    expect(page.url()).toContain("test-table.age=25");
    expect(page.url()).toContain("test-table.search=john");
    expect(page.url()).toContain("test-table.status=active");

    // Reload and verify all filters persist
    await page.reload();
    await expect(page.getByTestId("status")).toHaveValue("active");
    await expect(page.getByTestId("age")).toHaveValue("25");
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
    await page.getByTestId("status").selectOption("active");

    // Should reset to page 1
    await expect(page.getByTestId("page-info")).toHaveText("1 of 34");
    expect(page.url()).toContain("test-table.page=0");
  });

  test("should clear filters correctly", async ({ page }) => {
    await page.goto("/");

    // Wait for data to finish loading
    await waitForDataToLoad(page);

    // Apply filters
    await page.getByTestId("status").selectOption("active");
    await page.getByTestId("age").fill("30");
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

    await page.getByTestId("age").clear();
    await expect(page.getByTestId("current-state")).toContainText(
      "Column Filters: 1"
    );
    expect(page.url()).not.toContain("test-table.age");

    await page.getByTestId("status").selectOption("");
    await expect(page.getByTestId("current-state")).toContainText(
      "Column Filters: 0"
    );

    // Check URL is cleared (status filter is now in URL)
    expect(page.url()).not.toContain("test-table.status");
  });

  test("should handle async filter processing", async ({ page }) => {
    await page.goto("/");

    // Wait for data to finish loading
    await waitForDataToLoad(page);

    // Check that async filter processing is complete
    await expect(page.getByTestId("loading-filters")).not.toBeVisible();

    // Apply a filter that might trigger async processing
    await page.getByTestId("age").fill("25");

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
    await page.getByTestId("status").selectOption("active");
    await page.getByTestId("global-filter").fill("alice");
    await page.getByTestId("header-age").click(); // Sort by age
    await page.getByTestId("next-page").click();

    // Reload and verify everything persists
    await page.reload();

    await expect(page.getByTestId("status")).toHaveValue("active");
    await expect(page.getByTestId("global-filter")).toHaveValue("alice");
    await expect(page.getByTestId("header-age")).toContainText("Age 🔽");

    // Verify URL contains all relevant parameters
    expect(page.url()).toContain("test-table.search=alice");
    expect(page.url()).toContain("test-table.status=active");
    expect(page.url()).toContain("test-table.sort-col=age");
    expect(page.url()).toContain("test-table.page=1");
  });

  test("should persist birthdate filter in URL (date variant)", async ({
    page,
  }) => {
    await page.goto("/");
    await waitForDataToLoad(page);

    // Check initial state
    await expect(page.getByTestId("current-state")).toContainText(
      "Column Filters: 0"
    );

    // Apply birthdate filter for July 3, 2006 (first user's birthdate)
    await page.getByTestId("birthdate").fill("2006-07-03");
    await page.getByTestId("birthdate").blur();

    // Check URL contains birthdate filter
    expect(page.url()).toContain("test-table.birthdate=2006-07-03");
    await expect(page.getByTestId("current-state")).toContainText(
      "Column Filters: 1"
    );

    // Reload page and verify persistence
    await page.reload();
    await expect(page.getByTestId("birthdate")).toHaveValue("2006-07-03");
    await expect(page.getByTestId("current-state")).toContainText(
      "Column Filters: 1"
    );
    expect(page.url()).toContain("test-table.birthdate=2006-07-03");

    // Verify filtering works - should show only users with that birthdate
    const birthdateCells = page.locator('[data-testid^="cell-birthdate-"]');
    const firstCellText = await birthdateCells.first().textContent();
    expect(firstCellText).toBe("7/3/2006");
  });

  test("should persist hiring date range filter in URL (dateRange variant)", async ({
    page,
  }) => {
    await page.goto("/");
    await waitForDataToLoad(page);

    // Apply hiring date range filter
    await page.getByTestId("hiring-date-from-filter").fill("2020-01-01");
    await page.getByTestId("hiring-date-to-filter").fill("2021-12-31");
    await page.getByTestId("hiring-date-from-filter").blur();

    // Check URL contains hiring date range filter
    expect(page.url()).toContain("test-table.hiringDate");
    await expect(page.getByTestId("current-state")).toContainText(
      "Column Filters: 1"
    );

    // Reload page and verify persistence
    await page.reload();
    await expect(page.getByTestId("hiring-date-from-filter")).toHaveValue(
      "2020-01-01"
    );
    await expect(page.getByTestId("hiring-date-to-filter")).toHaveValue(
      "2021-12-31"
    );
    await expect(page.getByTestId("current-state")).toContainText(
      "Column Filters: 1"
    );

    // Test single-sided range (only from date)
    await page.getByTestId("hiring-date-to-filter").clear();
    await page.getByTestId("hiring-date-to-filter").blur();

    await expect(page.getByTestId("current-state")).toContainText(
      "Column Filters: 1"
    );

    // Test single-sided range (only to date)
    await page.getByTestId("hiring-date-from-filter").clear();
    await page.getByTestId("hiring-date-to-filter").fill("2020-12-31");
    await page.getByTestId("hiring-date-to-filter").blur();

    await expect(page.getByTestId("current-state")).toContainText(
      "Column Filters: 1"
    );
  });

  test("should persist salary range filter in URL (numberRange variant)", async ({
    page,
  }) => {
    await page.goto("/");
    await waitForDataToLoad(page);

    // Apply salary range filter
    await page.getByTestId("salary-min-filter").fill("50000");
    await page.getByTestId("salary-max-filter").fill("100000");
    await page.getByTestId("salary-min-filter").blur();

    // Check URL contains salary range filter
    expect(page.url()).toContain("test-table.salary");
    await expect(page.getByTestId("current-state")).toContainText(
      "Column Filters: 1"
    );

    // Reload page and verify persistence
    await page.reload();
    await expect(page.getByTestId("salary-min-filter")).toHaveValue("50000");
    await expect(page.getByTestId("salary-max-filter")).toHaveValue("100000");
    await expect(page.getByTestId("current-state")).toContainText(
      "Column Filters: 1"
    );

    // Verify filtering works - check that visible salaries are within range
    const salaryCells = page.locator('[data-testid^="cell-salary-"]');
    const count = await salaryCells.count();

    for (let i = 0; i < Math.min(count, 5); i++) {
      const salaryText = await salaryCells.nth(i).textContent();
      const salaryValue = parseInt(salaryText?.replace(/[$,]/g, "") || "0");
      expect(salaryValue).toBeGreaterThanOrEqual(50000);
      expect(salaryValue).toBeLessThanOrEqual(100000);
    }

    // Test single-sided range (only min)
    await page.getByTestId("salary-max-filter").clear();
    await page.getByTestId("salary-max-filter").blur();

    await expect(page.getByTestId("current-state")).toContainText(
      "Column Filters: 1"
    );

    // Test single-sided range (only max)
    await page.getByTestId("salary-min-filter").clear();
    await page.getByTestId("salary-max-filter").fill("75000");
    await page.getByTestId("salary-max-filter").blur();

    await expect(page.getByTestId("current-state")).toContainText(
      "Column Filters: 1"
    );
  });

  test("should persist teams multiselect filter in URL (multiSelect variant)", async ({
    page,
  }) => {
    await page.goto("/");
    await waitForDataToLoad(page);

    // Apply teams filter - select multiple teams
    await page.getByTestId("teams-finance").check();
    await page.getByTestId("teams-sales").check();

    // Check URL contains teams filter
    expect(page.url()).toContain("test-table.teams");
    await expect(page.getByTestId("current-state")).toContainText(
      "Column Filters: 1"
    );

    // Reload page and verify persistence
    await page.reload();
    await expect(page.getByTestId("teams-finance")).toBeChecked();
    await expect(page.getByTestId("teams-sales")).toBeChecked();
    await expect(page.getByTestId("teams-hr")).not.toBeChecked();
    await expect(page.getByTestId("teams-dev")).not.toBeChecked();
    await expect(page.getByTestId("current-state")).toContainText(
      "Column Filters: 1"
    );

    // Verify filtering works - check that visible teams contain selected values
    const teamsCells = page.locator('[data-testid^="cell-teams-"]');
    const count = await teamsCells.count();

    for (let i = 0; i < Math.min(count, 5); i++) {
      const teamsText = await teamsCells.nth(i).textContent();
      expect(
        teamsText?.includes("finance") || teamsText?.includes("sales")
      ).toBeTruthy();
    }

    // Test adding/removing selections
    await page.getByTestId("teams-hr").check();
    await expect(page.getByTestId("current-state")).toContainText(
      "Column Filters: 1"
    );

    // Test unchecking all
    await page.getByTestId("teams-finance").uncheck();
    await page.getByTestId("teams-sales").uncheck();
    await page.getByTestId("teams-hr").uncheck();

    // Should clear the filter when no teams selected
    await expect(page.getByTestId("current-state")).toContainText(
      "Column Filters: 0"
    );
  });

  test("should handle multiple new filters simultaneously", async ({
    page,
  }) => {
    await page.goto("/");
    await waitForDataToLoad(page);

    // Apply multiple new filters
    await page.getByTestId("birthdate").fill("2000-01-01");
    await page.getByTestId("salary-min-filter").fill("60000");
    await page.getByTestId("salary-max-filter").fill("150000");
    await page.getByTestId("teams-finance").check();
    await page.getByTestId("teams-dev").check();
    await page.getByTestId("hiring-date-from-filter").fill("2015-01-01");

    // Check all filters are applied
    await expect(page.getByTestId("current-state")).toContainText(
      "Column Filters: 4"
    );

    // Check URL contains all filters
    expect(page.url()).toContain("test-table.birthdate");
    expect(page.url()).toContain("test-table.salary");
    expect(page.url()).toContain("test-table.teams");
    expect(page.url()).toContain("test-table.hiringDate");

    // Reload and verify all filters persist
    await page.reload();
    await expect(page.getByTestId("birthdate")).toHaveValue("2000-01-01");
    await expect(page.getByTestId("salary-min-filter")).toHaveValue("60000");
    await expect(page.getByTestId("salary-max-filter")).toHaveValue("150000");
    await expect(page.getByTestId("teams-finance")).toBeChecked();
    await expect(page.getByTestId("teams-dev")).toBeChecked();
    await expect(page.getByTestId("hiring-date-from-filter")).toHaveValue(
      "2015-01-01"
    );
    await expect(page.getByTestId("current-state")).toContainText(
      "Column Filters: 4"
    );
  });

  test("should clear new filters correctly", async ({ page }) => {
    await page.goto("/");
    await waitForDataToLoad(page);

    // Apply multiple new filters
    await page.getByTestId("birthdate").fill("2000-01-01");
    await page.getByTestId("salary-min-filter").fill("50000");
    await page.getByTestId("teams-finance").check();
    await page.getByTestId("hiring-date-from-filter").fill("2020-01-01");

    // Verify filters are applied
    await expect(page.getByTestId("current-state")).toContainText(
      "Column Filters: 4"
    );

    // Clear filters one by one
    await page.getByTestId("birthdate").clear();
    await expect(page.getByTestId("current-state")).toContainText(
      "Column Filters: 3"
    );
    expect(page.url()).not.toContain("test-table.birthdate");

    await page.getByTestId("salary-min-filter").clear();
    await expect(page.getByTestId("current-state")).toContainText(
      "Column Filters: 2"
    );

    await page.getByTestId("teams-finance").uncheck();
    await expect(page.getByTestId("current-state")).toContainText(
      "Column Filters: 1"
    );
    expect(page.url()).not.toContain("test-table.teams");

    await page.getByTestId("hiring-date-from-filter").clear();
    await expect(page.getByTestId("current-state")).toContainText(
      "Column Filters: 0"
    );
    expect(page.url()).not.toContain("test-table.hiringDate");
  });

  test("should reset pagination when new filters change", async ({ page }) => {
    await page.goto("/");
    await waitForDataToLoad(page);

    // Navigate to page 3
    await page.getByTestId("goto-page").fill("3");
    await page.getByTestId("goto-page").press("Enter");
    await expect(page.getByTestId("page-info")).toContainText("3 of");

    // Apply a new filter
    await page.getByTestId("salary-min-filter").fill("100000");
    await page.getByTestId("salary-min-filter").blur();

    // Should reset to page 1
    await expect(page.getByTestId("page-info")).toContainText("1 of");
    expect(page.url()).toContain("test-table.page=0");
  });

  test("should combine new filters with existing filters", async ({ page }) => {
    await page.goto("/");
    await waitForDataToLoad(page);

    // Apply both old and new filters
    await page.getByTestId("age").fill("25");
    await page.getByTestId("status").selectOption("active");
    await page.getByTestId("global-filter").fill("john");
    await page.getByTestId("salary-min-filter").fill("70000");
    await page.getByTestId("teams-finance").check();

    // Check all filters are applied
    await expect(page.getByTestId("current-state")).toContainText(
      "Column Filters: 4"
    );
    await expect(page.getByTestId("current-state")).toContainText(
      "Global Filter: john"
    );

    // Reload and verify all filters persist
    await page.reload();
    await expect(page.getByTestId("age")).toHaveValue("25");
    await expect(page.getByTestId("status")).toHaveValue("active");
    await expect(page.getByTestId("global-filter")).toHaveValue("john");
    await expect(page.getByTestId("salary-min-filter")).toHaveValue("70000");
    await expect(page.getByTestId("teams-finance")).toBeChecked();
    await expect(page.getByTestId("current-state")).toContainText(
      "Column Filters: 4"
    );
    await expect(page.getByTestId("current-state")).toContainText(
      "Global Filter: john"
    );
  });
});
