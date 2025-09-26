import { test, expect } from '@playwright/test';

test('verify icon sizes are correct', async ({ page }) => {
  // Navigate to the homepage
  await page.goto('http://localhost:3003');

  // Wait for the page to load
  await page.waitForLoadState('networkidle');

  // Check the main logo icon
  const logoIcon = page.locator('nav svg').first();
  await expect(logoIcon).toBeVisible();

  // Get the computed styles of the logo icon
  const logoIconBox = await logoIcon.boundingBox();
  console.log('Logo icon dimensions:', logoIconBox);

  // Check feature icons in the features section
  const featureIcons = page.locator('div.absolute svg');
  const featureIconCount = await featureIcons.count();
  console.log(`Found ${featureIconCount} feature icons`);

  // Check the first feature icon
  if (featureIconCount > 0) {
    const firstFeatureIcon = featureIcons.first();
    const firstIconBox = await firstFeatureIcon.boundingBox();
    console.log('First feature icon dimensions:', firstIconBox);

    // Verify it's reasonably sized (should be around 24-48px, not 1000px+)
    if (firstIconBox) {
      expect(firstIconBox.width).toBeLessThan(100);
      expect(firstIconBox.height).toBeLessThan(100);
      expect(firstIconBox.width).toBeGreaterThan(16);
      expect(firstIconBox.height).toBeGreaterThan(16);
    }
  }

  // Check all feature icons
  for (let i = 0; i < featureIconCount; i++) {
    const icon = featureIcons.nth(i);
    const iconBox = await icon.boundingBox();
    console.log(`Feature icon ${i + 1} dimensions:`, iconBox);

    if (iconBox) {
      // Icons should be reasonably sized, not massive
      expect(iconBox.width).toBeLessThan(100);
      expect(iconBox.height).toBeLessThan(100);
    }
  }

  // Take a screenshot for visual verification
  await page.screenshot({ path: 'icon-test-result.png', fullPage: true });
});