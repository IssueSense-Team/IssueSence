# Quick Setup: Google Client ID

## 🚀 Fastest Way to Get Started

### 1. Get Your Client ID (5 minutes)

1. Visit: **https://console.cloud.google.com/apis/credentials**
2. Click **"+ CREATE CREDENTIALS"** > **"OAuth client ID"**
3. If asked, configure OAuth consent screen first (choose "External")
4. Select **"Web application"** as the application type
5. Give it a name (e.g., "My App")
6. Click **"Create"**
7. **Copy the Client ID** (the long string that looks like: `123456789-abc...apps.googleusercontent.com`)

### 2. Set It in Your Code (Choose ONE method)

#### Method A: Direct in Code (Easiest for Testing)

1. Open: `myApp/utils/googleAuth.ts`
2. Find line 16 that says:
   ```typescript
   const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID_HERE';
   ```
3. Replace `'YOUR_GOOGLE_CLIENT_ID_HERE'` with your copied Client ID:
   ```typescript
   const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '123456789-your-actual-client-id.apps.googleusercontent.com';
   ```

#### Method B: Using .env File (Better for Production)

1. Create a file named `.env` in the `myApp` folder
2. Add this line (replace with your actual Client ID):
   ```
   EXPO_PUBLIC_GOOGLE_CLIENT_ID=123456789-your-actual-client-id.apps.googleusercontent.com
   ```
3. **Restart your Expo server** (stop with Ctrl+C, then run `npm start` again)

### 3. Set Backend Client ID

1. Create a file named `.env` in the `myApp/backend` folder
2. Add this line (use the SAME Client ID):
   ```
   GOOGLE_CLIENT_ID=123456789-your-actual-client-id.apps.googleusercontent.com
   ```
3. Restart your backend server

### 4. Test It!

1. Start your backend: `cd myApp/backend && npm start`
2. Start your app: `cd myApp && npm start`
3. Click the Google button on login/signup page

## ✅ That's It!

Your Google authentication should now work!

## 📝 Example Client ID Format

Your Client ID will look like this:
```
123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com
```

Make sure you copy the **entire** string, including `.apps.googleusercontent.com`

## ⚠️ Important Notes

- The Client ID is **not secret** - it's safe to use in frontend code
- For development, use the **Web application** Client ID
- Make sure there are **no spaces** when you paste it
- **Restart your servers** after setting environment variables

