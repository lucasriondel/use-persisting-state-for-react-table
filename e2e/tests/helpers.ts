import { expect, Page } from "@playwright/test";

/**
 * Waits for data to finish loading by checking that the loading indicator disappears
 * and the data table becomes visible.
 *
 * @param page - The Playwright page object
 */
export async function waitForDataToLoad(page: Page) {
  // Wait for loading indicator to disappear, indicating data has finished loading
  await expect(page.getByTestId("loading-data")).not.toBeVisible({
    timeout: 10000,
  });
  // Wait for table to be visible
  await expect(page.getByTestId("data-table")).toBeVisible();
}
