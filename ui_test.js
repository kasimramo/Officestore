const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('1. Navigating to the application...');
    await page.goto('http://localhost:3002');

    console.log('2. Looking for login form...');
    await page.waitForSelector('input[type="email"], input[name="email"], input[placeholder*="email"]', { timeout: 10000 });

    console.log('3. Filling in login credentials...');
    await page.fill('input[type="email"], input[name="email"], input[placeholder*="email"]', 'support@d365boq.com');
    await page.fill('input[type="password"], input[name="password"], input[placeholder*="password"]', 'Support@0104');

    console.log('4. Clicking login button...');
    await page.click('button[type="submit"]');

    console.log('5. Waiting for navigation after login...');
    await page.waitForURL('**/admin-dashboard', { timeout: 10000 });

    console.log('6. Navigating to catalog page...');
    await page.goto('http://localhost:3002/catalog');

    console.log('7. Waiting for catalog page to load...');
    await page.waitForSelector('.catalog-container, [data-testid="catalog"], h1', { timeout: 10000 });

    console.log('8. Checking for TypeScript version indicators...');

    // Check for the comment we added
    const pageContent = await page.content();
    if (pageContent.includes('TESTING TYPESCRIPT')) {
      console.log('✅ TypeScript version detected in page source!');
    } else {
      console.log('❌ TypeScript version NOT found in page source');
    }

    // Look for yellow debug buttons with red borders
    console.log('9. Looking for debug-styled edit buttons...');
    const debugButtons = await page.$$('button[style*="yellow"]');
    if (debugButtons.length > 0) {
      console.log(`✅ Found ${debugButtons.length} debug-styled yellow buttons with red borders!`);

      // Try clicking the first edit button
      console.log('10. Clicking first debug edit button...');
      await debugButtons[0].click();

      // Wait a moment and check for alert or modal
      await page.waitForTimeout(1000);
      console.log('✅ Successfully clicked edit button!');

    } else {
      console.log('❌ No debug-styled yellow buttons found');

      // Let's check what buttons do exist
      const allButtons = await page.$$('button');
      console.log(`Found ${allButtons.length} total buttons on the page`);

      // Get styles of first few buttons for debugging
      for (let i = 0; i < Math.min(3, allButtons.length); i++) {
        const style = await allButtons[i].getAttribute('style');
        const className = await allButtons[i].getAttribute('class');
        const text = await allButtons[i].textContent();
        console.log(`Button ${i + 1}: style="${style}" class="${className}" text="${text?.trim()}"`);
      }
    }

    console.log('11. Taking screenshot...');
    await page.screenshot({ path: 'catalog_debug_test.png', fullPage: true });
    console.log('Screenshot saved as catalog_debug_test.png');

  } catch (error) {
    console.error('Error during test:', error);
    await page.screenshot({ path: 'error_screenshot.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();