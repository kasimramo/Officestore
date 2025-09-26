const fetch = require('node-fetch').default;

async function testLogin() {
  try {
    console.log('🧪 Testing login flow...');

    // Test user with no org membership
    console.log('\n1. Testing user with no org membership (test@example.com)');

    const response1 = await fetch('http://localhost:3002/api/auth/callback/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        email: 'test@example.com',
        password: 'testpass123',
        csrfToken: 'test',
        callbackUrl: 'http://localhost:3002/dashboard',
        json: 'true'
      }),
      redirect: 'manual'
    });

    console.log('Status:', response1.status);
    console.log('Response:', await response1.text());

    // Try accessing the session
    console.log('\n2. Checking if NextAuth is working by testing signin page');

    const signinResponse = await fetch('http://localhost:3002/auth/signin');
    console.log('Signin page status:', signinResponse.status);

  } catch (error) {
    console.error('❌ Error during login test:', error);
  }
}

testLogin();