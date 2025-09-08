import { expect, test } from "@playwright/test";
import { waitForDataToLoad } from "./helpers";

test.describe("Integration Tests - Full Hook Functionality", () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage and URL params before each test
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.clear();
      window.history.replaceState({}, "", "/");
    });
    await page.reload();
  });

  test("should handle complete workflow with all features", async ({
    page,
  }) => {
    await page.goto("/");

    // Wait for data to finish loading and async filters to complete
    await waitForDataToLoad(page);
    await expect(page.getByTestId("loading-filters")).not.toBeVisible();

    // Step 1: Apply filters
    await page.getByTestId("global-filter").fill("john");
    await page.getByTestId("status-filter").selectOption("active");
    await page.getByTestId("age-filter").fill("25");

    // Verify filters applied
    await expect(page.getByTestId("current-state")).toContainText(
      "Global Filter: john"
    );
    await expect(page.getByTestId("current-state")).toContainText(
      "Column Filters: 2"
    );

    // Step 2: Sort data
    await page.getByTestId("header-firstName").click();
    await expect(page.getByTestId("header-firstName")).toContainText("🔼");
    await expect(page.getByTestId("current-state")).toContainText(
      "Sorting: firstName (asc)"
    );

    // Step 3: Hide a column
    await page.getByTestId("toggle-email-column").click();
    await expect(page.getByTestId("header-email")).not.toBeVisible();

    // Step 4: Select rows
    await page.getByTestId("select-row-73").check();
    await page.getByTestId("select-row-61").check();
    await expect(page.getByTestId("current-state")).toContainText(
      "Selected Rows: 2"
    );

    // Step 5: Change pagination
    await page.getByTestId("page-size").selectOption("20");
    await expect(page.getByTestId("page-size")).toHaveValue("20");

    // Step 6: Navigate pages
    if (await page.getByTestId("next-page").isEnabled()) {
      await page.getByTestId("next-page").click();
      await expect(page.getByTestId("page-info")).toContainText("2 of");
    }

    // Verify URL contains relevant parameters
    expect(page.url()).toContain("test-table.search=john");
    expect(page.url()).toContain("test-table.age-filter=25");
    expect(page.url()).toContain("test-table.sort-col=firstName");
    expect(page.url()).toContain("test-table.sort-dir=asc");

    // Verify localStorage contains relevant data

    const localStorage = await page.evaluate(() => {
      const data = window.localStorage.getItem("e2e-test-table");

      return data ? JSON.parse(data) : null;
    });

    // Status filter is now in URL, not localStorage

    expect(localStorage.size).toBe(20);

    expect(localStorage.visibility).toEqual({ email: false });

    expect(localStorage.selection).toEqual({ "61": true, "73": true });

    // Step 7: Store localStorage and reload page to verify complete state persistence

    const storageState = await page.evaluate(() => {
      return localStorage.getItem("e2e-test-table");
    });

    await page.reload();
    await page.evaluate((storage) => {
      if (storage) {
        localStorage.setItem("e2e-test-table", storage);
      }
    }, storageState);
    await page.reload(); // Second reload to ensure localStorage is loaded

    // Verify all state is restored
    await expect(page.getByTestId("global-filter")).toHaveValue("john");
    await expect(page.getByTestId("status-filter")).toHaveValue("active");
    await expect(page.getByTestId("age-filter")).toHaveValue("25");
    await expect(page.getByTestId("header-firstName")).toContainText("🔼");
    await expect(page.getByTestId("header-email")).not.toBeVisible();
    await expect(page.getByTestId("select-row-73")).toBeChecked();
    await expect(page.getByTestId("select-row-61")).toBeChecked();
    await expect(page.getByTestId("page-size")).toHaveValue("20");

    // Verify computed state
    await expect(page.getByTestId("current-state")).toContainText(
      "Global Filter: john"
    );
    await expect(page.getByTestId("current-state")).toContainText(
      "Column Filters: 2"
    );
    await expect(page.getByTestId("current-state")).toContainText(
      "Sorting: firstName (asc)"
    );
    await expect(page.getByTestId("current-state")).toContainText(
      "Selected Rows: 2"
    );
  });

  test("should handle edge cases and error scenarios", async ({ page }) => {
    await page.goto("/");
    await waitForDataToLoad(page);

    // Test invalid page numbers
    await page.getByTestId("goto-page").fill("999");
    await page.getByTestId("goto-page").press("Enter");

    // Should handle gracefully (clamp to valid range)
    const pageInfo = await page.getByTestId("page-info").textContent();
    expect(pageInfo).toMatch(/\d+ of \d+/);

    // Test empty filter values
    await page.getByTestId("age-filter").fill("");
    await page.getByTestId("age-filter").blur();

    // Should clear the filter
    expect(page.url()).not.toContain("test-table.age-filter");

    // Test very large numbers
    await page.getByTestId("age-filter").fill("999");
    await page.getByTestId("age-filter").blur();

    // Should handle gracefully (likely no results)
    await expect(page.getByTestId("current-state")).toContainText(
      "Column Filters: 1"
    );

    // Clear filter and verify recovery
    await page.getByTestId("age-filter").clear();
    await page.getByTestId("age-filter").blur();
    await expect(page.getByTestId("current-state")).toContainText(
      "Column Filters: 0"
    );
  });

  test("should handle multiple browser tabs with same URL namespace", async ({
    context,
  }) => {
    // Create first tab
    const page1 = await context.newPage();
    await page1.goto("/");
    await waitForDataToLoad(page1);

    // Apply some state in first tab
    await page1.getByTestId("global-filter").fill("alice");
    await page1.getByTestId("status-filter").selectOption("active");
    await page1.getByTestId("header-age").click();

    // Create second tab and navigate to same URL
    const page2 = await context.newPage();
    await page2.goto(page1.url());
    await waitForDataToLoad(page2);

    // Second tab should inherit the state from URL
    await expect(page2.getByTestId("global-filter")).toHaveValue("alice");
    await expect(page2.getByTestId("header-age")).toContainText("Age 🔽");

    // But localStorage state might be different (status filter)
    // This tests the mixed persistence strategy
    await expect(page2.getByTestId("status-filter")).toHaveValue("active");

    // Make changes in second tab
    await page2.getByTestId("page-size").selectOption("20");
    await page2.getByTestId("select-row-94").check();

    // Switch back to first tab and store localStorage
    await page1.bringToFront();
    const storageState = await page1.evaluate(() => {
      return localStorage.getItem("e2e-test-table");
    });

    await page1.reload();
    await page1.evaluate((storage) => {
      if (storage) {
        localStorage.setItem("e2e-test-table", storage);
      }
    }, storageState);
    await page1.reload(); // Second reload to ensure localStorage is loaded

    await waitForDataToLoad(page1);

    // localStorage changes should be reflected
    await expect(page1.getByTestId("page-size")).toHaveValue("20");
    await expect(page1.getByTestId("select-row-94")).toBeChecked();

    await page1.close();
    await page2.close();
  });

  test("should handle localStorage corruption gracefully", async ({ page }) => {
    await page.goto("/");
    await waitForDataToLoad(page);

    // Corrupt localStorage with invalid JSON
    await page.evaluate(() => {
      localStorage.setItem("e2e-test-table", "invalid-json{");
    });

    // Reload page
    await page.reload();

    // Should handle gracefully and start with default state
    await waitForDataToLoad(page);
    await expect(page.getByTestId("current-state")).toContainText(
      "Selected Rows: 0"
    );
    await expect(page.getByTestId("current-state")).toContainText(
      "Column Filters: 0"
    );

    // Should be able to continue working normally
    await page.getByTestId("status-filter").selectOption("active");
    await expect(page.getByTestId("current-state")).toContainText(
      "Column Filters: 1"
    );
  });

  test("should handle URL parameter conflicts", async ({ page }) => {
    // Navigate with conflicting parameters
    await page.goto(
      "/?test-table.page=5&test-table.page=3&test-table.sort-col=age&test-table.sort-col=name"
    );
    await waitForDataToLoad(page);

    // Should handle gracefully (likely use the last value or first valid value)
    const pageInfo = await page.getByTestId("page-info").textContent();
    expect(pageInfo).toMatch(/\d+ of \d+/);

    // Table should be functional
    await page.getByTestId("status-filter").selectOption("active");
    await expect(page.getByTestId("current-state")).toContainText(
      "Column Filters: 1"
    );
  });

  test("should maintain performance with large datasets", async ({ page }) => {
    await page.goto("/");
    await waitForDataToLoad(page);

    // Start measuring time for operations
    const startTime = Date.now();

    // Perform multiple operations quickly
    await page.getByTestId("global-filter").fill("test-search");
    await page.getByTestId("status-filter").selectOption("active");
    await page.getByTestId("age-filter").fill("30");
    await page.getByTestId("header-firstName").click();
    await page.getByTestId("page-size").selectOption("50");

    // Select multiple rows
    for (let i = 1; i < 6; i++) {
      await page.getByTestId(`select-row-${i}`).check();
    }

    const endTime = Date.now();
    const operationTime = endTime - startTime;

    // Operations should complete in reasonable time (less than 5 seconds)
    expect(operationTime).toBeLessThan(5000);

    // Verify all operations completed successfully
    await expect(page.getByTestId("current-state")).toContainText(
      "Selected Rows: 5"
    );
    await expect(page.getByTestId("current-state")).toContainText(
      "Column Filters: 2"
    );
    await expect(page.getByTestId("current-state")).toContainText(
      "Global Filter: test-search"
    );
  });

  test("should handle rapid state changes without conflicts", async ({
    page,
  }) => {
    await page.goto("/");
    await waitForDataToLoad(page);

    await page.getByTestId("global-filter").fill("John");
    await page.getByTestId("age-filter").fill("25");
    await page.getByTestId("status-filter").selectOption("active");

    // Click sort multiple times rapidly
    for (let i = 0; i < 3; i++) {
      await page.getByTestId("header-firstName").click();
      await page.waitForTimeout(50);
    }

    // Change page size and navigate rapidly
    await page.getByTestId("page-size").selectOption("20");
    await page.getByTestId("next-page").click();
    await page.getByTestId("prev-page").click();

    // Final state should be consistent
    await expect(page.getByTestId("global-filter")).toHaveValue("John");
    await expect(page.getByTestId("age-filter")).toHaveValue("25");
    await expect(page.getByTestId("status-filter")).toHaveValue("active");
    await expect(page.getByTestId("page-size")).toHaveValue("20");

    await waitForDataToLoad(page);

    // Should still be functional after rapid changes
    await page.getByTestId("select-row-61").check();
    await expect(page.getByTestId("current-state")).toContainText(
      "Selected Rows: 1"
    );

    // Store localStorage and reload to verify persistence survived rapid changes
    const storageState = await page.evaluate(() => {
      return localStorage.getItem("e2e-test-table");
    });

    await page.reload();
    await page.evaluate((storage) => {
      if (storage) {
        localStorage.setItem("e2e-test-table", storage);
      }
    }, storageState);
    await page.reload(); // Second reload to ensure localStorage is loaded

    await expect(page.getByTestId("global-filter")).toHaveValue("John");
    await expect(page.getByTestId("status-filter")).toHaveValue("active");
    await expect(page.getByTestId("select-row-61")).toBeChecked();
  });

  test("should handle complex workflow with new filter variants", async ({
    page,
  }) => {
    await page.goto("/");
    await waitForDataToLoad(page);
    await expect(page.getByTestId("loading-filters")).not.toBeVisible();

    // Step 1: Apply complex filter combinations
    await page.getByTestId("global-filter").fill("alice");
    await page.getByTestId("status-filter").selectOption("active");
    await page.getByTestId("age-filter").fill("61");

    // Apply new filters
    await page.getByTestId("birthdate-filter").fill("1963-04-01");
    await page.getByTestId("salary-min-filter").fill("60000");
    await page.getByTestId("salary-max-filter").fill("120000");
    await page.getByTestId("teams-filter-finance").check();
    await page.getByTestId("teams-filter-hr").check();
    await page.getByTestId("hiring-date-from-filter").fill("2015-01-01");
    await page.getByTestId("hiring-date-to-filter").fill("2022-12-31");

    // Step 2: Verify all filters are applied
    await expect(page.getByTestId("current-state")).toContainText(
      "Global Filter: alice"
    );
    await expect(page.getByTestId("current-state")).toContainText(
      "Column Filters: 6"
    );

    // Step 3: Sort by new columns
    await page.getByTestId("header-salary").click();
    await expect(page.getByTestId("header-salary")).toContainText("Salary 🔽");
    await expect(page.getByTestId("current-state")).toContainText(
      "Sorting: salary (desc)"
    );

    // Sort by teams column
    await page.getByTestId("header-teams").click();
    await expect(page.getByTestId("header-teams")).toContainText("Teams 🔽");
    await expect(page.getByTestId("current-state")).toContainText(
      "Sorting: teams (desc)"
    );

    // Step 4: Hide new columns
    const emailToggleButton = page.getByTestId("toggle-email-column");
    await emailToggleButton.click();
    await expect(page.getByTestId("header-email")).not.toBeVisible();

    // Step 5: Select rows and change pagination
    await page.getByTestId("select-row-244").check();
    await page.getByTestId("page-size").selectOption("20");

    // Step 6: Verify URL contains all filter parameters
    expect(page.url()).toContain("test-table.search=alice");
    expect(page.url()).toContain("test-table.status-filter=active");
    expect(page.url()).toContain("test-table.age-filter=61");
    expect(page.url()).toContain("test-table.birthdate-filter=1963-04-01");
    expect(page.url()).toContain(
      "test-table.salary-filter=%5B60000%2C120000%5D"
    );
    expect(page.url()).toContain(
      "test-table.teams-filter=%5B%22finance%22%2C%22hr%22%5D"
    );
    expect(page.url()).toContain(
      "test-table.hiring-date-filter=%5B%222015-01-01%22%2C%222022-12-31%22%5D"
    );
    expect(page.url()).toContain("test-table.sort-col=teams");
    expect(page.url()).toContain("test-table.sort-dir=desc");

    // Step 7: Store state and reload
    const storageState = await page.evaluate(() => {
      return localStorage.getItem("e2e-test-table");
    });

    await page.reload();
    await page.evaluate((storage) => {
      if (storage) {
        localStorage.setItem("e2e-test-table", storage);
      }
    }, storageState);
    await page.reload();

    // Step 8: Verify complete state restoration
    await expect(page.getByTestId("global-filter")).toHaveValue("alice");
    await expect(page.getByTestId("status-filter")).toHaveValue("active");
    await expect(page.getByTestId("age-filter")).toHaveValue("61");
    await expect(page.getByTestId("birthdate-filter")).toHaveValue(
      "1963-04-01"
    );
    await expect(page.getByTestId("salary-min-filter")).toHaveValue("60000");
    await expect(page.getByTestId("salary-max-filter")).toHaveValue("120000");
    await expect(page.getByTestId("teams-filter-finance")).toBeChecked();
    await expect(page.getByTestId("teams-filter-hr")).toBeChecked();
    await expect(page.getByTestId("teams-filter-sales")).not.toBeChecked();
    await expect(page.getByTestId("teams-filter-dev")).not.toBeChecked();
    await expect(page.getByTestId("hiring-date-from-filter")).toHaveValue(
      "2015-01-01"
    );
    await expect(page.getByTestId("hiring-date-to-filter")).toHaveValue(
      "2022-12-31"
    );
    await expect(page.getByTestId("header-teams")).toContainText("Teams 🔽");
    await expect(page.getByTestId("current-state")).toContainText(
      "Sorting: teams (desc)"
    );
    await expect(page.getByTestId("header-email")).not.toBeVisible();

    await waitForDataToLoad(page);

    await expect(page.getByTestId("select-row-244")).toBeChecked();
    await expect(page.getByTestId("page-size")).toHaveValue("20");

    // Verify computed state
    await expect(page.getByTestId("current-state")).toContainText(
      "Global Filter: alice"
    );
    await expect(page.getByTestId("current-state")).toContainText(
      "Column Filters: 6"
    );
    await expect(page.getByTestId("current-state")).toContainText(
      "Sorting: teams (desc)"
    );
    await expect(page.getByTestId("current-state")).toContainText(
      "Selected Rows: 1"
    );
  });

  test("should handle edge cases with new filter combinations", async ({
    page,
  }) => {
    await page.goto("/");
    await waitForDataToLoad(page);

    // Test edge case: filters that result in no data
    await page.getByTestId("age-filter").fill("999");
    await page.getByTestId("salary-min-filter").fill("999999");
    await page.getByTestId("birthdate-filter").fill("1800-01-01");

    await waitForDataToLoad(page);

    // Should handle gracefully
    await expect(page.getByTestId("current-state")).toContainText(
      "Column Filters: 3"
    );
    await expect(page.locator("tbody tr")).toContainText("No data found");

    // Clear problematic filters
    await page.getByTestId("age-filter").clear();
    await page.getByTestId("salary-min-filter").clear();
    await page.getByTestId("birthdate-filter").clear();

    // Should recover
    await expect(page.getByTestId("current-state")).toContainText(
      "Column Filters: 0"
    );
    await expect(page.locator('[data-testid^="cell-firstName-"]')).toHaveCount(
      10
    );

    // Test edge case: invalid date ranges
    await page.getByTestId("hiring-date-from-filter").fill("2025-01-01");
    await page.getByTestId("hiring-date-to-filter").fill("2020-01-01");

    // Should handle gracefully (from > to)
    await expect(page.getByTestId("current-state")).toContainText(
      "Column Filters: 1"
    );

    // Test edge case: salary range where min > max
    await page.getByTestId("salary-min-filter").fill("200000");
    await page.getByTestId("salary-max-filter").fill("50000");

    await expect(page.getByTestId("current-state")).toContainText(
      "Column Filters: 2"
    );
  });

  test("should maintain performance with all filter types", async ({
    page,
  }) => {
    await page.goto("/");
    await waitForDataToLoad(page);

    const startTime = Date.now();

    // Apply all possible filters rapidly
    await page.getByTestId("global-filter").fill("grace");
    await page.getByTestId("age-filter").fill("26");
    await page.getByTestId("status-filter").selectOption("active");
    await page.getByTestId("birthdate-filter").fill("1998-07-23");
    await page.getByTestId("salary-min-filter").fill("50000");
    await page.getByTestId("salary-max-filter").fill("150000");
    await page.getByTestId("teams-filter-finance").check();
    await page.getByTestId("hiring-date-from-filter").fill("2010-01-01");
    await page.getByTestId("hiring-date-to-filter").fill("2024-12-31");

    // Sort and paginate
    await page.getByTestId("header-salary").click();
    await page.getByTestId("page-size").selectOption("50");

    await waitForDataToLoad(page);

    await page.getByTestId(`select-row-559`).check({ timeout: 1000 });

    const endTime = Date.now();
    const operationTime = endTime - startTime;

    // Operations should complete in reasonable time
    expect(operationTime).toBeLessThan(10000);

    // Verify final state is consistent
    await expect(page.getByTestId("current-state")).toContainText(
      "Global Filter: grace"
    );
    await expect(page.getByTestId("current-state")).toContainText(
      "Column Filters: 6"
    );
    await expect(page.getByTestId("page-size")).toHaveValue("50");
  });

  test("should handle rapid filter changes without state corruption", async ({
    page,
  }) => {
    await page.goto("/");
    await waitForDataToLoad(page);

    // Rapidly change multiple filters
    for (let i = 0; i < 5; i++) {
      await page.getByTestId("age-filter").fill(`${25 + i}`);
      await page.getByTestId("salary-min-filter").fill(`${50000 + i * 10000}`);

      if (i % 2 === 0) {
        await page.getByTestId("teams-filter-finance").check();
        await page.getByTestId("teams-filter-sales").uncheck();
      } else {
        await page.getByTestId("teams-filter-finance").uncheck();
        await page.getByTestId("teams-filter-sales").check();
      }

      await page.waitForTimeout(100);
    }

    // Apply final stable state
    await page.getByTestId("age-filter").fill("30");
    await page.getByTestId("salary-min-filter").fill("70000");
    await page.getByTestId("salary-max-filter").fill("120000");
    await page.getByTestId("teams-filter-finance").check();
    await page.getByTestId("teams-filter-sales").check();
    await page.getByTestId("birthdate-filter").fill("1994-01-01");

    // Wait for stabilization
    await waitForDataToLoad(page);

    // Final state should be consistent
    await expect(page.getByTestId("age-filter")).toHaveValue("30");
    await expect(page.getByTestId("salary-min-filter")).toHaveValue("70000");
    await expect(page.getByTestId("salary-max-filter")).toHaveValue("120000");
    await expect(page.getByTestId("teams-filter-finance")).toBeChecked();
    await expect(page.getByTestId("teams-filter-sales")).toBeChecked();
    await expect(page.getByTestId("birthdate-filter")).toHaveValue(
      "1994-01-01"
    );

    await waitForDataToLoad(page);

    // Store and reload to verify persistence survived rapid changes
    const storageState = await page.evaluate(() => {
      return localStorage.getItem("e2e-test-table");
    });

    await page.reload();
    await page.evaluate((storage) => {
      if (storage) {
        localStorage.setItem("e2e-test-table", storage);
      }
    }, storageState);
    await page.reload();

    // State should persist correctly
    await expect(page.getByTestId("age-filter")).toHaveValue("30");
    await expect(page.getByTestId("salary-min-filter")).toHaveValue("70000");
    await expect(page.getByTestId("teams-filter-finance")).toBeChecked();
    await expect(page.getByTestId("birthdate-filter")).toHaveValue(
      "1994-01-01"
    );
  });

  test("should handle global search with new column data", async ({ page }) => {
    await page.goto("/");
    await waitForDataToLoad(page);

    // Test global search finding data in teams column
    await page.getByTestId("global-filter").fill("finance");

    await waitForDataToLoad(page);

    // Should find users with finance in their teams
    await expect(page.getByTestId("current-state")).toContainText(
      "Global Filter: finance"
    );

    // Verify that visible rows contain finance in teams
    const teamsCells = page.locator('[data-testid^="cell-teams-"]');
    const count = await teamsCells.count();

    if (count > 0) {
      const firstTeamsText = await teamsCells.first().textContent();
      expect(firstTeamsText).toContain("finance");
    }

    // Test global search with salary-related terms (should not find anything since salary isn't searchable)
    await page.getByTestId("global-filter").fill("87717");

    await waitForDataToLoad(page);

    // Should not find matches (salary is not included in global search)
    await expect(page.locator("tbody tr")).toContainText("No data found");

    // Test global search with team names
    await page.getByTestId("global-filter").fill("dev");

    // Should find users with dev in their teams
    const devTeamsCells = page.locator('[data-testid^="cell-teams-"]');
    const devCount = await devTeamsCells.count();

    if (devCount > 0) {
      const firstDevTeamsText = await devTeamsCells.first().textContent();
      expect(firstDevTeamsText).toContain("dev");
    }
  });
});
