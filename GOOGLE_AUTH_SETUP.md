# Google Authentication Setup Guide

This guide will help you set up Google OAuth authentication for your app.

## Prerequisites

1. A Google Cloud Platform (GCP) account
2. Access to the Google Cloud Console

## Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google+ API" or "Google Identity"
   - Click "Enable"

4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - If prompted, configure the OAuth consent screen first:
     - Choose "External" (unless you have a Google Workspace)
     - Fill in the required information (App name, User support email, Developer contact)
     - Add scopes: `openid`, `profile`, `email`
     - Add test users if needed (for development)
     - Save and continue

5. Create OAuth Client IDs:
   - Application type: **Web application** (for backend)
     - Name: "Backend Server"
     - Authorized redirect URIs: Leave empty or add your backend URL
     - Click "Create"
     - **Save the Client ID** - you'll need this for the backend
   
   - Application type: **iOS** (if testing on iOS)
     - Name: "iOS App"
     - Bundle ID: Your app's bundle ID (check app.json)
     - Click "Create"
     - **Save the Client ID**
   
   - Application type: **Android** (if testing on Android)
     - Name: "Android App"
     - Package name: Your app's package name (check app.json)
     - SHA-1 certificate fingerprint: Get this from your keystore
     - Click "Create"
     - **Save the Client ID**

## Step 2: Configure Frontend

1. Open `myApp/utils/googleAuth.ts`
2. Replace `YOUR_GOOGLE_CLIENT_ID_HERE` with your **iOS or Android Client ID** (depending on your platform)
   - For web/Expo Go: Use the **Web application** Client ID
   - For iOS: Use the **iOS** Client ID
   - For Android: Use the **Android** Client ID

Alternatively, create a `.env` file in the `myApp` directory:
```
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your_client_id_here
```

## Step 3: Configure Backend

1. Open `myApp/backend/routes/auth.js`
2. Replace `YOUR_GOOGLE_CLIENT_ID` with your **Web application** Client ID

Alternatively, create a `.env` file in the `myApp/backend` directory:
```
GOOGLE_CLIENT_ID=your_web_client_id_here
```

Then update `myApp/backend/routes/auth.js` to use:
```javascript
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
```

And make sure to load dotenv in your backend `index.js`:
```javascript
import dotenv from 'dotenv';
dotenv.config();
```

## Step 4: Update app.json (if needed)

The redirect URI scheme is already configured in `app.json` as `"scheme": "myapp"`. If you want to change it, update both:
- `app.json`: Change the `scheme` value
- `myApp/utils/googleAuth.ts`: Update the redirect URI scheme

## Step 5: Test the Integration

1. Start your backend server:
   ```bash
   cd myApp/backend
   npm start
   ```

2. Start your Expo app:
   ```bash
   cd myApp
   npm start
   ```

3. Navigate to the login or signup page
4. Click the Google sign-in button
5. Complete the OAuth flow

## Troubleshooting

### "Invalid client" error
- Make sure you're using the correct Client ID for your platform
- Verify the Client ID is correctly set in both frontend and backend

### "Redirect URI mismatch" error
- For Expo Go: The redirect URI is automatically handled by Expo
- For standalone builds: Make sure your OAuth credentials match your app's bundle ID/package name

### "User cancelled" error
- This is normal if the user closes the OAuth browser window
- No action needed

### Backend verification fails
- Ensure the backend is using the **Web application** Client ID
- Check that `google-auth-library` is installed: `npm install google-auth-library`
- Verify your backend server is accessible from your device/emulator

## Security Notes

- **Never commit** your Client IDs or secrets to version control
- Use environment variables for all sensitive configuration
- In production, use proper environment variable management
- The Client ID can be public, but keep your Client Secret secure (if using server-side flow)

## Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Expo AuthSession Documentation](https://docs.expo.dev/guides/authentication/#google)
- [Google Auth Library for Node.js](https://github.com/googleapis/google-auth-library-nodejs)

