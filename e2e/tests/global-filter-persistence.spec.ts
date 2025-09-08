import { expect, test } from "@playwright/test";
import { waitForDataToLoad } from "./helpers";

test.describe("Global Filter Persistence - Extended Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage and URL params before each test
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.clear();
      window.history.replaceState({}, "", "/");
    });
    await page.reload();
  });

  test("should persist global filter with special characters", async ({
    page,
  }) => {
    await page.goto("/");
    await waitForDataToLoad(page);

    // Test with special characters that need URL encoding
    const specialSearchTerms = [
      "john@example.com",
      "user with spaces",
      "user-with-dashes",
      "user_with_underscores",
      "user%with%percent",
      "user+with+plus",
    ];

    for (const searchTerm of specialSearchTerms) {
      // Apply global filter with special characters
      await page.getByTestId("global-filter").fill(searchTerm);
      await page.getByTestId("global-filter").blur();

      // Wait for URL to update (debouncing)
      await page.waitForTimeout(1000);

      // Check URL contains encoded global filter
      if (searchTerm === "user with spaces") {
        expect(page.url()).toContain("test-table.search=user+with+spaces");
      } else {
        expect(page.url()).toContain(
          "test-table.search=" + encodeURIComponent(searchTerm)
        );
      }

      await expect(page.getByTestId("current-state")).toContainText(
        `Global Filter: ${searchTerm}`
      );

      // Reload page and verify persistence
      await page.reload();
      await waitForDataToLoad(page);
      await expect(page.getByTestId("global-filter")).toHaveValue(searchTerm);
      await expect(page.getByTestId("current-state")).toContainText(
        `Global Filter: ${searchTerm}`
      );

      // Clear for next iteration
      await page.getByTestId("global-filter").clear();
    }
  });

  test("should handle global filter with very long search terms", async ({
    page,
  }) => {
    await page.goto("/");
    await waitForDataToLoad(page);

    // Test with very long search term
    const longSearchTerm = "a".repeat(100);

    await page.getByTestId("global-filter").fill(longSearchTerm);
    await page.getByTestId("global-filter").blur();

    // Check URL handles long filter
    expect(page.url()).toContain("test-table.search=" + longSearchTerm);
    await expect(page.getByTestId("current-state")).toContainText(
      `Global Filter: ${longSearchTerm}`
    );

    // Reload and verify persistence
    await page.reload();
    await expect(page.getByTestId("global-filter")).toHaveValue(longSearchTerm);
  });

  test("should persist global filter across browser navigation", async ({
    page,
  }) => {
    await page.goto("/");
    await waitForDataToLoad(page);

    // Apply global filter
    await page.getByTestId("global-filter").fill("alice");
    await page.getByTestId("global-filter").blur();

    // Navigate away and back using browser controls
    await page.goto("about:blank");
    await page.goBack();

    await waitForDataToLoad(page);

    // Verify filter is still applied
    await expect(page.getByTestId("global-filter")).toHaveValue("alice");
    await expect(page.getByTestId("current-state")).toContainText(
      "Global Filter: alice"
    );
  });

  test("should handle global filter persistence with mixed case", async ({
    page,
  }) => {
    await page.goto("/");
    await waitForDataToLoad(page);

    const mixedCaseTerms = ["John", "ALICE", "bOb", "MixEdCaSe"];

    for (const term of mixedCaseTerms) {
      await page.getByTestId("global-filter").fill(term);
      await page.getByTestId("global-filter").blur();

      // Reload and verify exact case is preserved
      await page.reload();
      await expect(page.getByTestId("global-filter")).toHaveValue(term);
      await expect(page.getByTestId("current-state")).toContainText(
        `Global Filter: ${term}`
      );

      // Clear for next iteration
      await page.getByTestId("global-filter").clear();
    }
  });

  test("should persist global filter with rapid typing and debouncing", async ({
    page,
  }) => {
    await page.goto("/");
    await waitForDataToLoad(page);

    // Type rapidly to test debouncing behavior
    const finalSearchTerm = "rapidtyping";
    const globalFilter = page.getByTestId("global-filter");

    // Type characters rapidly
    await globalFilter.fill("");
    await globalFilter.pressSequentially(finalSearchTerm, { delay: 50 });

    // Wait for debounce to complete
    await page.waitForTimeout(500);
    await globalFilter.blur();

    // Check final state
    expect(page.url()).toContain("test-table.search=" + finalSearchTerm);
    await expect(page.getByTestId("current-state")).toContainText(
      `Global Filter: ${finalSearchTerm}`
    );

    // Reload and verify persistence
    await page.reload();
    await expect(page.getByTestId("global-filter")).toHaveValue(
      finalSearchTerm
    );
  });

  test("should handle global filter with empty and whitespace values", async ({
    page,
  }) => {
    await page.goto("/");
    await waitForDataToLoad(page);

    // First apply a filter
    await page.getByTestId("global-filter").fill("john");
    await page.getByTestId("global-filter").blur();
    expect(page.url()).toContain("test-table.search=john");

    // Clear to empty string
    await page.getByTestId("global-filter").clear();
    await page.getByTestId("global-filter").blur();

    // Should remove from URL
    expect(page.url()).not.toContain("test-table.search");
    await expect(page.getByTestId("current-state")).toContainText(
      "Global Filter: None"
    );

    // Test with whitespace only
    await page.getByTestId("global-filter").fill("   ");
    await page.getByTestId("global-filter").blur();

    // Should handle whitespace appropriately
    await expect(page.getByTestId("current-state")).toContainText(
      "Global Filter:    "
    );

    // Reload and verify
    await page.reload();
    await expect(page.getByTestId("global-filter")).toHaveValue("   ");
  });

  test("should persist global filter when combined with programmatic navigation", async ({
    page,
  }) => {
    await page.goto("/");
    await waitForDataToLoad(page);

    // Apply global filter
    await page.getByTestId("global-filter").fill("searchterm");
    await page.getByTestId("global-filter").blur();

    // Simulate programmatic navigation (like router.push in SPA)
    await page.evaluate(() => {
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set("additional-param", "value");
      window.history.pushState({}, "", currentUrl.toString());
    });

    // Reload and verify filter persists
    await page.reload();
    await expect(page.getByTestId("global-filter")).toHaveValue("searchterm");
    expect(page.url()).toContain("test-table.search=searchterm");
    expect(page.url()).toContain("additional-param=value");
  });

  test("should maintain global filter state during error scenarios", async ({
    page,
  }) => {
    await page.goto("/");
    await waitForDataToLoad(page);

    // Apply global filter
    await page.getByTestId("global-filter").fill("resilientfilter");
    await page.getByTestId("global-filter").blur();

    // Simulate network interruption by going offline
    await page.context().setOffline(true);

    // Try to reload (should fail but state should be preserved in URL)
    await page.reload().catch(() => {});

    // Go back online
    await page.context().setOffline(false);

    // Reload successfully
    await page.reload();
    await waitForDataToLoad(page);

    // Filter should still be preserved
    await expect(page.getByTestId("global-filter")).toHaveValue(
      "resilientfilter"
    );
  });

  test("should persist global filter with concurrent user interactions", async ({
    page,
  }) => {
    await page.goto("/");
    await waitForDataToLoad(page);

    // Apply global filter
    await page.getByTestId("global-filter").fill("concurrent");

    // Simultaneously interact with other table features while typing
    await Promise.all([
      page.getByTestId("status").selectOption("active"),
      page.getByTestId("header-firstName").click(),
      page.getByTestId("global-filter").blur(),
    ]);

    // Verify all states are correctly applied
    await expect(page.getByTestId("global-filter")).toHaveValue("concurrent");
    expect(page.url()).toContain("test-table.search=concurrent");
    expect(page.url()).toContain("test-table.status=active");

    // Reload and verify all state persists
    await page.reload();
    await expect(page.getByTestId("global-filter")).toHaveValue("concurrent");
    await expect(page.getByTestId("status")).toHaveValue("active");
  });

  test("should handle global filter persistence with URL manipulation", async ({
    page,
  }) => {
    await page.goto("/");
    await waitForDataToLoad(page);

    // Start with one filter
    await page.getByTestId("global-filter").fill("original");
    await page.getByTestId("global-filter").blur();

    // Manually modify URL to have a different global filter
    await page.evaluate(() => {
      const url = new URL(window.location.href);
      url.searchParams.set("test-table.search", "manipulated");
      window.history.replaceState({}, "", url.toString());
    });

    // Reload to see if URL takes precedence
    await page.reload();
    await waitForDataToLoad(page);

    // URL should take precedence over previous state
    await expect(page.getByTestId("global-filter")).toHaveValue("manipulated");
    await expect(page.getByTestId("current-state")).toContainText(
      "Global Filter: manipulated"
    );
  });

  test("should preserve global filter during table refresh operations", async ({
    page,
  }) => {
    await page.goto("/");
    await waitForDataToLoad(page);

    // Apply global filter
    await page.getByTestId("global-filter").fill("persistent");
    await page.getByTestId("global-filter").blur();

    await expect(page.getByTestId("current-state")).toContainText(
      "Global Filter: persistent"
    );

    // Simulate data refresh (if refresh button exists)
    const refreshButton = page.getByTestId("refresh-data");
    if (await refreshButton.isVisible()) {
      await refreshButton.click();
      await waitForDataToLoad(page);
    }

    // Global filter should remain
    await expect(page.getByTestId("global-filter")).toHaveValue("persistent");
    await expect(page.getByTestId("current-state")).toContainText(
      "Global Filter: persistent"
    );
  });
});
