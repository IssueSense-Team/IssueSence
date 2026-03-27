# Fix: "Parameter not allowed for this response type" Error

## Problem
When trying to authenticate with Google, you see:
- "Access blocked: Authentication error"
- "Parameter not allowed for this response type"

## Solution Applied

The code has been updated to use the **implicit flow** correctly with Google OAuth:

1. ✅ Removed all extra parameters that cause the error
2. ✅ Using `IdToken` response type (correct for mobile apps)
3. ✅ Using direct discovery endpoints (no auto-fetch that might add params)
4. ✅ Proper redirect URI configuration

## Additional Steps Required

### 1. Check Google Cloud Console Configuration

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Select your OAuth 2.0 Client ID (Web application type)
3. Check **Authorized redirect URIs**:
   - For Expo Go: Should include `https://auth.expo.io/@your-username/myApp`
   - Or leave it empty/use wildcard if using Expo proxy
   - The redirect URI must match exactly what Expo generates

### 2. Verify OAuth Consent Screen

1. Go to **APIs & Services** > **OAuth consent screen**
2. Make sure the app is published or you're added as a test user
3. Required scopes should be:
   - `openid`
   - `profile` 
   - `email`

### 3. Check Your Client ID

- Make sure you're using the **Web application** Client ID (not iOS/Android)
- The Client ID should look like: `123456789-abc...apps.googleusercontent.com`
- Use the **same** Client ID in both frontend and backend `.env` files

### 4. Clear Cache and Retry

1. Clear your browser cache
2. Clear Expo cache: `expo start -c`
3. Try authentication again

## What Changed in the Code

### Before (Causing Error):
```typescript
const request = new AuthSession.AuthRequest({
  // ... config
  additionalParameters: {},  // ❌ These cause the error
  extraParams: {},            // ❌ These cause the error
});
```

### After (Fixed):
```typescript
const request = new AuthSession.AuthRequest({
  clientId: GOOGLE_CLIENT_ID,
  scopes: ['openid', 'profile', 'email'],
  responseType: AuthSession.ResponseType.IdToken,
  redirectUri: redirectUri,
  // ✅ No extra parameters
});
```

## Testing

1. Make sure your `.env` files are set up correctly
2. Restart both frontend and backend servers
3. Try the Google sign-in button
4. Check the console for any errors

## If Still Having Issues

1. **Check the redirect URI**:
   - Look at the console log: "Redirect URI: ..."
   - Make sure this exact URI is in Google Cloud Console

2. **Try a different approach**:
   - If using Expo Go, make sure you're using the proxy URL
   - For standalone builds, you may need platform-specific Client IDs

3. **Verify scopes**:
   - Make sure `openid`, `profile`, and `email` are requested
   - Check Google Cloud Console that these scopes are approved

4. **Check for typos**:
   - Client ID in `.env` files
   - No extra spaces or characters
   - Exact match between frontend and backend

## Common Mistakes

❌ **Wrong Client ID type**: Using iOS/Android Client ID instead of Web application
❌ **Extra parameters**: Adding `additionalParameters` or `extraParams`
❌ **Wrong redirect URI**: Not matching the Expo proxy URL
❌ **Missing scopes**: Not requesting `openid` scope
❌ **Not restarted**: Forgetting to restart servers after `.env` changes

## Need More Help?

- Check the console logs for detailed error messages
- Verify your Google Cloud Console configuration
- Make sure your `.env` files are correctly set up
- Try clearing cache and restarting

