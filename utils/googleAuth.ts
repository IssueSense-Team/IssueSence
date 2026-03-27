import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { Platform } from 'react-native';

// Safely initialize WebBrowser
try {
  if (Platform.OS === 'web') {
    WebBrowser.maybeCompleteAuthSession();
  }
} catch (e) { console.warn('WebBrowser init failed', e); }

const EXPO_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || 'YOUR_WEB_CLIENT_ID';

export const useGoogleAuth = () => {
  // We return a "hook-like" signature but with NO ACTUAL HOOKS that can crash render.

  const signInWithGoogle = async () => {
    try {
      // 1. Construct the Authentication URL manually
      // Use Expo Proxy (https://auth.expo.io/@username/slug) to avoid Google blocking 'exp://'
      const redirectUri = AuthSession.makeRedirectUri({
        useProxy: true,
      });

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth` +
        `?client_id=${encodeURIComponent(EXPO_CLIENT_ID)}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&response_type=id_token` +
        `&scope=${encodeURIComponent('openid profile email')}` +
        `&nonce=${Math.random().toString(36).substring(7)}`; // Simple nonce

      console.log('Starting Google Auth with URL:', authUrl);

      // 2. Open the Auth Session (Imperative - won't crash render)
      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

      // 3. Handle Result
      if (result.type === 'success') {
        // Extract token from URL fragment
        const params = new URLSearchParams(result.url.split('#')[1]);
        const idToken = params.get('id_token');

        if (idToken) {
          return { success: true, idToken };
        } else {
          return { success: false, error: 'No ID token found in response' };
        }
      } else {
        return { success: false, error: 'User cancelled or failed' };
      }
    } catch (e: any) {
      console.warn("Manual Google Auth Error", e);
      return { success: false, error: e.message };
    }
  };

  return {
    signInWithGoogle,
    request: true, // Dummy "true" so the button is enabled
    response: null,
  };
};
