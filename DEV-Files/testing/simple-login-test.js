const { chromium } = require('playwright');

async function simpleLoginTest() {
  const browser = await chromium.launch({ headless: false, slowMo: 1000 });
  const page = await browser.newPage();

  try {
    console.log('🌐 Going to http://localhost:3002...');
    await page.goto('http://localhost:3002', { waitUntil: 'domcontentloaded', timeout: 60000 });

    console.log('📸 Taking screenshot of initial page...');
    await page.screenshot({ path: 'DEV-Files/testing/initial-page.png' });

    // Check current URL
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);

    // If we're on signin page or redirected there, try login
    if (currentUrl.includes('/auth/signin') || currentUrl === 'http://localhost:3002/') {

      // Navigate to signin if needed
      if (!currentUrl.includes('/auth/signin')) {
        console.log('🔄 Navigating to signin...');
        await page.goto('http://localhost:3002/auth/signin', { waitUntil: 'domcontentloaded', timeout: 30000 });
      }

      console.log('📸 Taking screenshot of signin page...');
      await page.screenshot({ path: 'DEV-Files/testing/signin-page.png' });

      // Wait for email field and fill
      console.log('⌨️ Filling email...');
      await page.waitForSelector('input[type="email"]');
      await page.fill('input[type="email"]', 'support@d365boq.com');

      // Fill password
      console.log('⌨️ Filling password...');
      await page.fill('input[type="password"]', 'Support@0104');

      console.log('📸 Taking screenshot after filling form...');
      await page.screenshot({ path: 'DEV-Files/testing/form-filled.png' });

      // Submit
      console.log('🖱️ Clicking submit...');
      await page.click('button[type="submit"]');

      // Wait for navigation or response
      console.log('⏳ Waiting for response...');
      await page.waitForTimeout(5000);

      console.log('📸 Taking screenshot after submit...');
      await page.screenshot({ path: 'DEV-Files/testing/after-submit.png' });

      const finalUrl = page.url();
      console.log('Final URL:', finalUrl);

      if (finalUrl.includes('/dashboard') || !finalUrl.includes('/auth/signin')) {
        console.log('✅ Login appears successful!');
      } else {
        console.log('❌ Still on signin page');

        // Check for error messages
        const errorText = await page.$eval('body', el => el.textContent).catch(() => '');
        if (errorText.includes('Invalid') || errorText.includes('error')) {
          console.log('Found error text in page');
        }
      }
    }

  } catch (error) {
    console.error('❌ Error during test:', error);
    await page.screenshot({ path: 'DEV-Files/testing/error-screenshot.png' });
  }

  // Keep browser open for inspection
  console.log('🔍 Browser will remain open for 30 seconds for inspection...');
  await page.waitForTimeout(30000);

  await browser.close();
}

simpleLoginTest();