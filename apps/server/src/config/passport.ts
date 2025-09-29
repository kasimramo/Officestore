import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { authService } from '../services/auth.js';

// Configure Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  callbackURL: process.env.LOCAL_CALLBACK_URL!
}, async (accessToken, refreshToken, profile, done) => {
  try {
    console.log('Google OAuth callback received:', {
      id: profile.id,
      email: profile.emails?.[0]?.value,
      name: profile.displayName
    });

    // Check if user exists by Google ID or email
    let user = await authService.findUserByGoogleId(profile.id);

    if (!user && profile.emails?.[0]) {
      // Try to find by email
      user = await authService.findUserByEmail(profile.emails[0].value);

      if (user) {
        // Link Google account to existing user
        user = await authService.linkGoogleAccount(user.id, profile.id);
      }
    }

    if (!user) {
      // Create new user from Google profile
      const userData = {
        googleId: profile.id,
        email: profile.emails?.[0]?.value || '',
        firstName: profile.name?.givenName || '',
        lastName: profile.name?.familyName || '',
        avatar: profile.photos?.[0]?.value,
        provider: 'google'
      };

      user = await authService.createGoogleUser(userData);
    }

    return done(null, user);
  } catch (error) {
    console.error('Google OAuth error:', error);
    return done(error, null);
  }
}));

// Serialize user for session
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await authService.getUserById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;