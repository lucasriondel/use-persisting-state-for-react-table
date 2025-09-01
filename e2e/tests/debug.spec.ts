import { test, expect } from '@playwright/test';

test.describe('Debug Tests', () => {
  test('should load the application', async ({ page }) => {
    // Capture console errors and all messages
    const errors: string[] = [];
    const logs: string[] = [];
    page.on('console', (message) => {
      const text = message.text();
      logs.push(`${message.type()}: ${text}`);
      if (message.type() === 'error') {
        errors.push(text);
      }
    });

    // Capture page errors
    page.on('pageerror', (error) => {
      errors.push(`Page error: ${error.message}`);
    });

    // Navigate to the page
    await page.goto('/');
    
    // Wait a moment for any JavaScript to load
    await page.waitForTimeout(5000);
    
    // Log all messages
    console.log('Console logs:', logs);
    
    // Log any errors
    if (errors.length > 0) {
      console.log('Console errors:', errors);
    } else {
      console.log('No JavaScript errors detected');
    }
    
    // Check page title
    await expect(page).toHaveTitle('E2E Test App - usePersistingStateForReactTable');
    
    // Check if React has rendered content
    const content = await page.locator('#root').innerHTML();
    console.log('Root content:', content);
    
    // Check if root div has content
    const hasContent = content.trim().length > 0;
    console.log('Has content:', hasContent);
    
    // Try to find the app
    await expect(page.getByTestId('app')).toBeVisible({ timeout: 10000 });
  });
});