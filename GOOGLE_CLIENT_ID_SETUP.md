# How to Get and Set Your Google Client ID

## Step 1: Get Your Google Client ID

### Option A: Quick Setup (For Development/Testing)

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/

2. **Create or Select a Project**
   - Click the project dropdown at the top
   - Click "New Project" or select an existing one
   - Give it a name (e.g., "IssueSense AI")

3. **Enable Google+ API**
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API" or "Google Identity"
   - Click "Enable"

4. **Configure OAuth Consent Screen**
   - Go to "APIs & Services" > "OAuth consent screen"
   - Choose "External" (unless you have Google Workspace)
   - Fill in:
     - App name: "IssueSense AI" (or your app name)
     - User support email: Your email
     - Developer contact: Your email
   - Click "Save and Continue"
   - On "Scopes" page, click "Add or Remove Scopes"
   - Add these scopes:
     - `openid`
     - `profile`
     - `email`
   - Click "Update" then "Save and Continue"
   - On "Test users" page, add your email if testing
   - Click "Save and Continue" then "Back to Dashboard"

5. **Create OAuth 2.0 Client ID**
   - Go to "APIs & Services" > "Credentials"
   - Click "+ CREATE CREDENTIALS" > "OAuth client ID"
   - Application type: **Web application**
   - Name: "Expo App" (or any name)
   - Authorized redirect URIs: 
     - For Expo Go: `https://auth.expo.io/@your-username/myApp`
     - Or leave empty for now (Expo handles it)
   - Click "Create"
   - **COPY THE CLIENT ID** (it looks like: `123456789-abcdefghijklmnop.apps.googleusercontent.com`)

## Step 2: Set the Client ID in Your Code

You have **3 options** to set your Client ID:

### Option 1: Using .env File (Recommended)

1. Create a file named `.env` in the `myApp` folder (same level as `package.json`)

2. Add this line:
   ```
   EXPO_PUBLIC_GOOGLE_CLIENT_ID=your_client_id_here
   ```
   Replace `your_client_id_here` with the Client ID you copied

3. Example:
   ```
   EXPO_PUBLIC_GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
   ```

4. **Important**: Restart your Expo development server after creating/updating the .env file

### Option 2: Set Directly in Code

1. Open `myApp/utils/googleAuth.ts`
2. Find this line:
   ```typescript
   const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID_HERE';
   ```
3. Replace `'YOUR_GOOGLE_CLIENT_ID_HERE'` with your actual Client ID:
   ```typescript
   const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '123456789-abcdefghijklmnop.apps.googleusercontent.com';
   ```

### Option 3: Set in app.json (Alternative)

You can also add it to `app.json` under `expo.extra`:
```json
{
  "expo": {
    "extra": {
      "googleClientId": "your_client_id_here"
    }
  }
}
```

Then update `googleAuth.ts` to read from there.

## Step 3: Set Backend Client ID

You also need to set the Client ID for the backend:

1. Create a file named `.env` in the `myApp/backend` folder

2. Add this line:
   ```
   GOOGLE_CLIENT_ID=your_web_client_id_here
   ```
   (Use the same Web application Client ID)

3. The backend code in `myApp/backend/routes/auth.js` will automatically read it

## Step 4: Test It

1. Make sure your backend server is running
2. Restart your Expo app (stop and start `npm start`)
3. Try clicking the Google sign-in button on the login or signup page

## Troubleshooting

**"Invalid client" error:**
- Make sure you copied the entire Client ID (no spaces)
- Verify the Client ID is correct in your code
- Restart your Expo server after changing .env

**"Redirect URI mismatch":**
- For Expo Go, this should work automatically
- If using standalone builds, you may need to add specific redirect URIs in Google Console

**Environment variable not working:**
- Make sure the variable name starts with `EXPO_PUBLIC_` for Expo
- Restart the Expo development server after creating/updating .env
- Check that the .env file is in the correct location (same folder as package.json)

## Quick Reference

- **Frontend Client ID**: Used in `myApp/utils/googleAuth.ts`
- **Backend Client ID**: Used in `myApp/backend/routes/auth.js`
- **For development**: Use the **Web application** Client ID for both
- **For production**: You may need separate iOS/Android Client IDs

