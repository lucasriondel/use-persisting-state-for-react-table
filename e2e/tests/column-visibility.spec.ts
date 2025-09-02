import { expect, test } from "@playwright/test";

test.describe("Column Visibility Persistence", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.clear();
      window.history.replaceState({}, "", "/");
    });
    await page.reload();
  });

  test("should persist column visibility in localStorage", async ({ page }) => {
    // Wait for the table to load
    await expect(page.getByTestId("data-table")).toBeVisible();

    // Check that email column is initially visible
    await expect(page.getByTestId("header-email")).toBeVisible();
    await expect(page.getByTestId("cell-email-0")).toBeVisible();

    // Hide email column
    await page.getByTestId("toggle-email-column").click();

    // Check that email column is now hidden
    await expect(page.getByTestId("header-email")).not.toBeVisible();
    await expect(page.getByTestId("cell-email-0")).not.toBeVisible();

    // Check localStorage contains the visibility setting
    const visibility = await page.evaluate(() => {
      const data = localStorage.getItem("e2e-test-table");
      return data ? JSON.parse(data).visibility : null;
    });
    expect(visibility).toEqual({ email: false });

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

    // Wait for the table to reload
    await expect(page.getByTestId("data-table")).toBeVisible();

    // Verify persistence
    await expect(page.getByTestId("header-email")).not.toBeVisible();
    await expect(page.getByTestId("cell-email-0")).not.toBeVisible();
  });

  test("should show column when toggled back", async ({ page }) => {
    // Wait for the table to load
    await expect(page.getByTestId("data-table")).toBeVisible();

    // Hide email column first
    await page.getByTestId("toggle-email-column").click();
    await expect(page.getByTestId("header-email")).not.toBeVisible();

    // Show email column again
    await page.getByTestId("toggle-email-column").click();
    await expect(page.getByTestId("header-email")).toBeVisible();
    await expect(page.getByTestId("cell-email-0")).toBeVisible();

    // Check localStorage reflects the change
    const visibility = await page.evaluate(() => {
      const data = localStorage.getItem("e2e-test-table");
      return data ? JSON.parse(data).visibility : null;
    });
    expect(visibility).toEqual({ email: true });
  });

  test("should maintain column visibility with other state", async ({
    browser,
  }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto("/");

    // Wait for the table to load
    await expect(page.getByTestId("data-table")).toBeVisible();

    // Apply various state changes
    await page.getByTestId("toggle-email-column").click(); // Hide email
    await page.getByTestId("status-filter").selectOption("active"); // Filter
    await page.getByTestId("header-firstName").click(); // Sort
    await page.getByTestId("next-page").click(); // Navigate (will reset due to filter)

    // Email column should still be hidden
    await expect(page.getByTestId("header-email")).not.toBeVisible();
    await expect(page.getByTestId("cell-email-0")).not.toBeVisible();

    // Reload and verify all state persists
    // const storageState = await context.storageState();

    const storageStateFromLS = await page.evaluate(() => {
      return localStorage.getItem("e2e-test-table");
    });

    // console.log(storageState.origins[0].localStorage);
    console.log(storageStateFromLS);

    await page.reload();
    // const storageState2 = await context.storageState();

    // console.log(storageState.origins[0].localStorage);
    // console.log(storageState2.origins[0].localStorage);

    await expect(page.getByTestId("header-email")).not.toBeVisible();
    await expect(page.getByTestId("status-filter")).toHaveValue("active");
    await expect(page.getByTestId("header-firstName")).toContainText("🔼");

    await context.close();
    await browser.close();
  });

  test("should not affect table functionality when columns are hidden", async ({
    page,
  }) => {
    await page.goto("/");

    // Wait for the table to load
    await expect(page.getByTestId("data-table")).toBeVisible();

    // Hide email column
    await page.getByTestId("toggle-email-column").click();

    // Verify other columns are still sortable and functional
    await page.getByTestId("header-firstName").click();
    await expect(page.getByTestId("header-firstName")).toContainText("🔼");

    // Verify filtering still works
    await page.getByTestId("status-filter").selectOption("active");
    await expect(page.getByTestId("current-state")).toContainText(
      "Filtered Rows: 50"
    );

    // Verify row selection still works
    await page.getByTestId("select-row-0").check();
    await expect(page.getByTestId("current-state")).toContainText(
      "Selected Rows: 1"
    );

    // The hidden email column should not interfere with any functionality
    await expect(page.getByTestId("header-email")).not.toBeVisible();
  });

  test("should handle multiple column visibility changes", async ({ page }) => {
    await page.goto("/");

    // Wait for the table to load
    await expect(page.getByTestId("data-table")).toBeVisible();

    // Get initial column count
    const initialHeaders = await page
      .locator('[data-testid^="header-"]')
      .count();
    expect(initialHeaders).toBe(6); // id, firstName, lastName, age, status, email

    // Hide email column
    await page.getByTestId("toggle-email-column").click();

    // Verify one less column is visible
    const afterHideHeaders = await page
      .locator('[data-testid^="header-"]')
      .count();
    expect(afterHideHeaders).toBe(5);

    // Show email column again
    await page.getByTestId("toggle-email-column").click();

    // Verify all columns are visible again
    const afterShowHeaders = await page
      .locator('[data-testid^="header-"]')
      .count();
    expect(afterShowHeaders).toBe(6);

    // Check that localStorage reflects the final state
    const visibility = await page.evaluate(() => {
      const data = localStorage.getItem("e2e-test-table");
      return data ? JSON.parse(data).visibility : null;
    });
    expect(visibility).toEqual({ email: true });
  });

  test("should clear column visibility from localStorage when reset to default", async ({
    page,
  }) => {
    await page.goto("/");

    // Wait for the table to load
    await expect(page.getByTestId("data-table")).toBeVisible();

    // Hide email column
    await page.getByTestId("toggle-email-column").click();

    // Verify visibility is stored in localStorage
    let visibility = await page.evaluate(() => {
      const data = localStorage.getItem("e2e-test-table");
      return data ? JSON.parse(data).visibility : null;
    });
    expect(visibility).toEqual({ email: false });

    // Show email column again (back to default state)
    await page.getByTestId("toggle-email-column").click();

    // When back to default, the visibility setting should be cleaned up or set to true
    visibility = await page.evaluate(() => {
      const data = localStorage.getItem("e2e-test-table");
      return data ? JSON.parse(data).visibility : null;
    });
    expect(visibility).toEqual({ email: true });
  });

  test("should work with table sorting and filtering while column is hidden", async ({
    page,
  }) => {
    await page.goto("/");

    // Wait for the table to load
    await expect(page.getByTestId("data-table")).toBeVisible();

    // Hide email column first
    await page.getByTestId("toggle-email-column").click();
    await expect(page.getByTestId("header-email")).not.toBeVisible();

    // Sort by first name
    await page.getByTestId("header-firstName").click();
    await expect(page.getByTestId("header-firstName")).toContainText("🔼");

    // Apply status filter
    await page.getByTestId("status-filter").selectOption("active");
    await expect(page.getByTestId("current-state")).toContainText(
      "Filtered Rows: 50"
    );

    // Navigate to different page
    await page.getByTestId("page-size").selectOption("20");
    await page.getByTestId("goto-page").fill("2");
    await page.getByTestId("goto-page").press("Enter");

    // Email column should still be hidden throughout all operations
    await expect(page.getByTestId("header-email")).not.toBeVisible();

    // All other functionality should work normally
    await expect(page.getByTestId("header-firstName")).toContainText("🔼");
    await expect(page.getByTestId("status-filter")).toHaveValue("active");
    await expect(page.getByTestId("page-info")).toContainText("2 of 3"); // 50 active / 20 per page = 3 pages

    // Reload and verify everything persists
    await page.reload();

    await expect(page.getByTestId("header-email")).not.toBeVisible();
    await expect(page.getByTestId("header-firstName")).toContainText("🔼");
    await expect(page.getByTestId("status-filter")).toHaveValue("active");
  });
});
