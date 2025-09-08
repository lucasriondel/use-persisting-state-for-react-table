import { expect, test } from "@playwright/test";
import { waitForDataToLoad } from "./helpers";

test.describe("Row Selection Persistence", () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage and URL params before each test
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.clear();
      window.history.replaceState({}, "", "/");
    });
    await page.reload();
  });

  test("should persist row selection in localStorage", async ({ page }) => {
    await page.goto("/");

    // Wait for data to finish loading
    await waitForDataToLoad(page);

    // Check initial state - no rows selected
    await expect(page.getByTestId("current-state")).toContainText(
      "Selected Rows: 0"
    );

    // Select first row
    await page.getByTestId("select-row-1").check();
    await expect(page.getByTestId("current-state")).toContainText(
      "Selected Rows: 1"
    );

    // Select third row
    await page.getByTestId("select-row-2").check();
    await expect(page.getByTestId("current-state")).toContainText(
      "Selected Rows: 2"
    );

    // Check localStorage contains the selections
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const selection = await page.evaluate(() => {
      const data = localStorage.getItem("e2e-test-table");
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
      return data ? JSON.parse(data).selection : null;
    });
    expect(selection).toEqual({ "1": true, "2": true });

    // Store the localStorage for persistence test
    const storageState = await page.evaluate(() => {
      return localStorage.getItem("e2e-test-table");
    });

    // Reload page preserving localStorage
    await page.reload();
    await page.evaluate((storage) => {
      if (storage) {
        localStorage.setItem("e2e-test-table", storage);
      }
    }, storageState);
    await page.reload(); // Second reload to ensure localStorage is loaded

    await expect(page.getByTestId("select-row-1")).toBeChecked();
    await expect(page.getByTestId("select-row-2")).toBeChecked();
    await expect(page.getByTestId("current-state")).toContainText(
      "Selected Rows: 2"
    );
  });

  test("should handle select all functionality", async ({ page }) => {
    await page.goto("/");

    // Wait for data to finish loading
    await waitForDataToLoad(page);

    // Select all rows on current page
    await page.getByTestId("select-all").check();

    // All visible rows should be selected (10 rows on page 1 with default page size)
    await expect(page.getByTestId("current-state")).toContainText(
      "Selected Rows: 10"
    );

    // Check that all row checkboxes are checked
    for (let i = 1; i < 10; i++) {
      await expect(page.getByTestId(`select-row-${i}`)).toBeChecked();
    }

    // Check localStorage contains all selections
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const selection = await page.evaluate(() => {
      const data = localStorage.getItem("e2e-test-table");
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
      return data ? JSON.parse(data).selection : null;
    });

    // Should have 10 entries (0-9)
    expect(Object.keys(selection).length).toBe(10);
    for (let i = 1; i < 10; i++) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(selection[i.toString()]).toBe(true);
    }

    // Store the localStorage for persistence test
    const storageState = await page.evaluate(() => {
      return localStorage.getItem("e2e-test-table");
    });

    // Reload page preserving localStorage
    await page.reload();
    await page.evaluate((storage) => {
      if (storage) {
        localStorage.setItem("e2e-test-table", storage);
      }
    }, storageState);
    await page.reload(); // Second reload to ensure localStorage is loaded

    await expect(page.getByTestId("select-all")).toBeChecked();
    await expect(page.getByTestId("current-state")).toContainText(
      "Selected Rows: 10"
    );
  });

  test("should deselect rows correctly", async ({ page }) => {
    await page.goto("/");

    // Wait for data to finish loading
    await waitForDataToLoad(page);

    // Select multiple rows
    await page.getByTestId("select-row-1").check();
    await page.getByTestId("select-row-2").check();
    await page.getByTestId("select-row-3").check();
    await expect(page.getByTestId("current-state")).toContainText(
      "Selected Rows: 3"
    );

    // Deselect middle row
    await page.getByTestId("select-row-1").uncheck();
    await expect(page.getByTestId("current-state")).toContainText(
      "Selected Rows: 2"
    );

    // Check localStorage is updated
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const selection = await page.evaluate(() => {
      const data = localStorage.getItem("e2e-test-table");
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
      return data ? JSON.parse(data).selection : null;
    });
    expect(selection).toEqual({ "2": true, "3": true });

    // Store the localStorage for persistence test
    const storageState = await page.evaluate(() => {
      return localStorage.getItem("e2e-test-table");
    });

    // Reload page preserving localStorage
    await page.reload();
    await page.evaluate((storage) => {
      if (storage) {
        localStorage.setItem("e2e-test-table", storage);
      }
    }, storageState);
    await page.reload(); // Second reload to ensure localStorage is loaded

    await expect(page.getByTestId("select-row-1")).not.toBeChecked();
    await expect(page.getByTestId("select-row-2")).toBeChecked();
    await expect(page.getByTestId("select-row-3")).toBeChecked();
    await expect(page.getByTestId("current-state")).toContainText(
      "Selected Rows: 2"
    );
  });

  test("should clear all selections", async ({ page }) => {
    await page.goto("/");

    // Wait for data to finish loading
    await waitForDataToLoad(page);

    // Select multiple rows
    await page.getByTestId("select-row-1").check();
    await page.getByTestId("select-row-2").check();
    await page.getByTestId("select-row-3").check();
    await expect(page.getByTestId("current-state")).toContainText(
      "Selected Rows: 3"
    );

    // Clear all selections
    await page.getByTestId("clear-selection").click();
    await expect(page.getByTestId("current-state")).toContainText(
      "Selected Rows: 0"
    );

    // All checkboxes should be unchecked
    await expect(page.getByTestId("select-row-1")).not.toBeChecked();
    await expect(page.getByTestId("select-row-2")).not.toBeChecked();
    await expect(page.getByTestId("select-row-3")).not.toBeChecked();
    await expect(page.getByTestId("select-all")).not.toBeChecked();

    // Check localStorage is cleared
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const selection = await page.evaluate(() => {
      const data = localStorage.getItem("e2e-test-table");
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
      return data ? JSON.parse(data).selection : null;
    });
    expect(selection).toBeUndefined();
  });

  test("should maintain selections across pagination", async ({ page }) => {
    await page.goto("/");

    // Wait for data to finish loading
    await waitForDataToLoad(page);

    // Select rows on first page
    await page.getByTestId("select-row-1").check();
    await page.getByTestId("select-row-2").check();

    // Go to next page
    await page.getByTestId("next-page").click();
    await expect(page.getByTestId("page-info")).toHaveText("2 of 100");

    // Select rows on second page (these will be row indices 10, 11)
    await page.getByTestId("select-row-10").check();
    await page.getByTestId("select-row-11").check();

    // Should now have 4 total selected rows
    await expect(page.getByTestId("current-state")).toContainText(
      "Selected Rows: 4"
    );

    // Go back to first page
    await page.getByTestId("prev-page").click();
    await expect(page.getByTestId("page-info")).toHaveText("1 of 100");

    // Previously selected rows should still be selected
    await expect(page.getByTestId("select-row-1")).toBeChecked();
    await expect(page.getByTestId("select-row-2")).toBeChecked();
    await expect(page.getByTestId("current-state")).toContainText(
      "Selected Rows: 4"
    );

    // Store the localStorage for persistence test
    const storageState = await page.evaluate(() => {
      return localStorage.getItem("e2e-test-table");
    });

    // Reload page preserving localStorage
    await page.reload();
    await page.evaluate((storage) => {
      if (storage) {
        localStorage.setItem("e2e-test-table", storage);
      }
    }, storageState);
    await page.reload(); // Second reload to ensure localStorage is loaded

    await expect(page.getByTestId("current-state")).toContainText(
      "Selected Rows: 4"
    );
    await expect(page.getByTestId("select-row-1")).toBeChecked();
    await expect(page.getByTestId("select-row-2")).toBeChecked();

    // Check second page selections are still there
    await page.getByTestId("next-page").click();
    await expect(page.getByTestId("select-row-10")).toBeChecked();
    await expect(page.getByTestId("select-row-11")).toBeChecked();
  });

  test("should maintain selections with filtering", async ({ page }) => {
    await page.goto("/");

    // Wait for data to finish loading
    await waitForDataToLoad(page);

    // Select some rows
    await page.getByTestId("select-row-1").check();
    await page.getByTestId("select-row-2").check();
    await page.getByTestId("select-row-3").check();
    await expect(page.getByTestId("current-state")).toContainText(
      "Selected Rows: 3"
    );

    // Apply a filter
    await page.getByTestId("status").selectOption("active");

    // Selected count should be maintained (even if some selected rows are now filtered out)
    // The behavior depends on how the hook handles filtered selections
    // For this test, we'll verify that the selection state is preserved
    await expect(page.getByTestId("current-state")).toContainText(
      "Selected Rows: 3"
    );

    // Remove filter
    await page.getByTestId("status").selectOption("");

    // All selections should still be there
    await expect(page.getByTestId("select-row-1")).toBeChecked();
    await expect(page.getByTestId("select-row-2")).toBeChecked();
    await expect(page.getByTestId("select-row-3")).toBeChecked();
    await expect(page.getByTestId("current-state")).toContainText(
      "Selected Rows: 3"
    );
  });

  test("should handle select all with filtering", async ({ page }) => {
    await page.goto("/");

    // Wait for data to finish loading
    await waitForDataToLoad(page);

    // Apply a filter first
    await page.getByTestId("status").selectOption("active");
    await expect(page.getByTestId("current-state")).toContainText(
      "Column Filters: 1"
    );

    // Select all visible rows (should be 10 active rows on current page)
    await page.getByTestId("select-all").check();
    await expect(page.getByTestId("current-state")).toContainText(
      "Selected Rows: 10"
    );

    // Remove filter
    await page.getByTestId("status").selectOption("");

    // Should still show 10 selected rows, but now we can see all 100 rows
    await expect(page.getByTestId("current-state")).toContainText(
      "Selected Rows: 10"
    );
    await expect(page.getByTestId("current-state")).toContainText(
      "Column Filters: 0"
    );

    // The previously selected rows should remain selected
    // (This tests that selection persists across filter changes)
  });

  test("should work with complex state combinations", async ({ page }) => {
    await page.goto("/");

    // Wait for data to finish loading
    await waitForDataToLoad(page);

    // Apply complex state
    await page.getByTestId("select-row-1").check();
    await page.getByTestId("select-row-5").check();
    await page.getByTestId("status").selectOption("active");
    await page.getByTestId("header-firstName").click(); // Sort
    await page.getByTestId("page-size").selectOption("20");
    await page.getByTestId("global-filter").fill("alice");

    // Navigate to see if selections persist
    await page.getByTestId("next-page").click(); // Will reset due to filter change

    // Go back to first page
    await page.getByTestId("first-page").click();

    // Selections should be maintained
    await expect(page.getByTestId("current-state")).toContainText(
      "Selected Rows: 2"
    );

    // Store the localStorage for persistence test
    const storageState = await page.evaluate(() => {
      return localStorage.getItem("e2e-test-table");
    });

    // Reload page preserving localStorage
    await page.reload();
    await page.evaluate((storage) => {
      if (storage) {
        localStorage.setItem("e2e-test-table", storage);
      }
    }, storageState);
    await page.reload(); // Second reload to ensure localStorage is loaded

    await expect(page.getByTestId("current-state")).toContainText(
      "Selected Rows: 2"
    );
    await expect(page.getByTestId("status")).toHaveValue("active");
    await expect(page.getByTestId("header-firstName")).toContainText("🔼");
    await expect(page.getByTestId("page-size")).toHaveValue("20");
    await expect(page.getByTestId("global-filter")).toHaveValue("alice");

    // Check localStorage contains all the state
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const storage = await page.evaluate(() => {
      const data = localStorage.getItem("e2e-test-table");
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return data ? JSON.parse(data) : null;
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(storage.selection).toEqual({ "1": true, "5": true });
    // Status filter is now in URL, not localStorage
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(storage.size).toBe(20);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(storage.visibility).toBeUndefined();
  });
});
