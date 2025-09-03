import { expect, test } from "@playwright/test";

async function waitForDataToLoad(page: any) {
  // Wait for loading indicator to disappear, indicating data has finished loading
  await expect(page.getByTestId("loading-data")).not.toBeVisible({
    timeout: 10000,
  });
  // Wait for table to be visible
  await expect(page.getByTestId("data-table")).toBeVisible();
}

test.describe("Pagination Persistence", () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage and URL params before each test
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.clear();
      window.history.replaceState({}, "", "/");
    });
    await page.reload();
  });

  test("should persist page index in URL", async ({ page }) => {
    await page.goto("/");

    // Wait for data to finish loading
    await waitForDataToLoad(page);

    // Check initial state - should be on page 1
    await expect(page.getByTestId("page-info")).toHaveText("1 of 100");

    // Navigate to page 3
    await page.getByTestId("goto-page").fill("3");
    await page.getByTestId("goto-page").press("Enter");

    // Check URL contains page parameter
    expect(page.url()).toContain("test-table.page=2"); // 0-indexed
    await expect(page.getByTestId("page-info")).toHaveText("3 of 100");

    // Reload page and verify persistence
    await page.reload();
    await waitForDataToLoad(page);
    await expect(page.getByTestId("page-info")).toHaveText("3 of 100");
    expect(page.url()).toContain("test-table.page=2");
  });

  test("should persist page size in localStorage", async ({ page }) => {
    await page.goto("/");

    // Wait for data to finish loading
    await waitForDataToLoad(page);

    // Check initial page size
    await expect(page.getByTestId("page-size")).toHaveValue("10");

    // Change page size to 20
    await page.getByTestId("page-size").selectOption("20");

    // Check localStorage contains the page size
    const pageSize = await page.evaluate(() => {
      const data = localStorage.getItem("e2e-test-table");
      return data ? JSON.parse(data).size : null;
    });
    expect(pageSize).toBe(20);

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

    // Wait for data to finish loading
    await waitForDataToLoad(page);

    // Verify persistence
    await expect(page.getByTestId("page-size")).toHaveValue("20");
    await expect(page.getByTestId("page-info")).toContainText("of 5"); // 100 items / 20 per page = 5 pages
  });

  test("should navigate through pages correctly", async ({ page }) => {
    await page.goto("/");

    // Wait for data to finish loading
    await waitForDataToLoad(page);

    // Test next page navigation
    await page.getByTestId("next-page").click();
    await expect(page.getByTestId("page-info")).toHaveText("2 of 100");
    expect(page.url()).toContain("test-table.page=1");

    // Test previous page navigation
    await page.getByTestId("prev-page").click();
    await expect(page.getByTestId("page-info")).toHaveText("1 of 100");
    expect(page.url()).toContain("test-table.page=0");

    // Test first page button
    await page.getByTestId("goto-page").fill("5");
    await page.getByTestId("goto-page").press("Enter");
    await page.getByTestId("first-page").click();
    await expect(page.getByTestId("page-info")).toHaveText("1 of 100");

    // Test last page button
    await page.getByTestId("last-page").click();
    await expect(page.getByTestId("page-info")).toHaveText("100 of 100");
  });

  test("should reset pagination correctly", async ({ page }) => {
    await page.goto("/");

    // Wait for data to finish loading
    await waitForDataToLoad(page);

    // Navigate to a different page and change page size
    await page.getByTestId("page-size").selectOption("20");
    await page.getByTestId("goto-page").fill("3");
    await page.getByTestId("goto-page").press("Enter");

    await expect(page.getByTestId("page-info")).toHaveText("3 of 50");

    // Reset pagination
    await page.getByTestId("reset-pagination").click();

    // Should go back to first page but keep the page size
    await expect(page.getByTestId("page-info")).toHaveText("1 of 50");
    await expect(page.getByTestId("page-size")).toHaveValue("20");
    expect(page.url()).toContain("test-table.page=0");
  });

  test("should handle pagination with filtering", async ({ page }) => {
    await page.goto("/");

    // Wait for data to finish loading
    await waitForDataToLoad(page);

    // Apply a filter that reduces results
    await page.getByTestId("status-filter").selectOption("active");

    // Wait for filter to take effect
    await page.waitForTimeout(100);

    // Should automatically reset to first page
    await expect(page.getByTestId("page-info")).toHaveText("1 of 34");
    expect(page.url()).toContain("test-table.page=0");

    // Navigate to page 3
    await page.getByTestId("goto-page").fill("3");
    await page.getByTestId("goto-page").press("Enter");
    await expect(page.getByTestId("page-info")).toHaveText("3 of 34");

    // Remove filter - should stay on same page if possible
    await page.getByTestId("status-filter").selectOption("");
    await page.waitForTimeout(100); // Wait for filter removal
    await expect(page.getByTestId("page-info")).toHaveText("1 of 100"); // Reset due to automaticPageReset
  });
});
