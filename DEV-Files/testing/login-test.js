const { chromium } = require('playwright');

async function testLogin() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('🌐 Navigating to login page...');
    await page.goto('http://localhost:3002');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Check if we're already logged in or need to login
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);

    if (currentUrl.includes('/auth/signin') || currentUrl === 'http://localhost:3002/') {
      console.log('🔐 Login page detected, attempting login...');

      // If redirected to signin, we're not logged in
      if (!currentUrl.includes('/auth/signin')) {
        // Navigate to signin page
        await page.goto('http://localhost:3002/auth/signin');
        await page.waitForLoadState('networkidle');
      }

      // Wait for form to be visible
      await page.waitForSelector('input[type="email"]', { timeout: 5000 });

      // Fill in the login form - the form uses react-hook-form
      await page.fill('input[type="email"]', 'support@d365boq.com');
      await page.fill('input[type="password"]', 'Support@0104');

      console.log('📝 Filled login form');

      // Click sign in button and wait for response
      await Promise.all([
        page.waitForResponse(response => response.url().includes('/api/auth/callback/credentials')),
        page.click('button[type="submit"]')
      ]);
      console.log('🖱️ Clicked sign in button and got response');

      // Wait a bit for any redirect
      await page.waitForTimeout(2000);

      const newUrl = page.url();
      console.log('After login URL:', newUrl);

      // Check for error messages first
      const errorElement = await page.$('.bg-red-50, .text-red-800, .text-red-600');
      if (errorElement) {
        const errorMessage = await errorElement.textContent();
        console.log('❌ Error message found:', errorMessage);
      }

      if (newUrl.includes('/dashboard') || (newUrl === 'http://localhost:3002/' && !newUrl.includes('/auth/signin'))) {
        console.log('✅ Login successful!');

        // Take a screenshot of successful login
        await page.screenshot({ path: 'DEV-Files/testing/login-success.png' });

        // Check for user info on page
        const userInfo = await page.textContent('body').catch(() => 'Could not read page content');
        if (userInfo.includes('Support') || userInfo.includes('support@d365boq.com')) {
          console.log('✅ User information detected on page');
        }

      } else if (newUrl.includes('/auth/signin')) {
        console.log('❌ Login failed - still on signin page');

        // Take screenshot of error
        await page.screenshot({ path: 'DEV-Files/testing/login-error.png' });

        // Check console logs for errors
        const consoleLogs = [];
        page.on('console', msg => {
          if (msg.type() === 'error') {
            consoleLogs.push(msg.text());
          }
        });

        if (consoleLogs.length > 0) {
          console.log('Console errors:', consoleLogs);
        }
      }

    } else {
      console.log('✅ Already logged in!');
      await page.screenshot({ path: 'DEV-Files/testing/already-logged-in.png' });
    }

  } catch (error) {
    console.error('❌ Test error:', error);
    await page.screenshot({ path: 'DEV-Files/testing/test-error.png' });
  } finally {
    await browser.close();
  }
}

testLogin();