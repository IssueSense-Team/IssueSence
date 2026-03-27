# Environment Variables Setup Guide

This guide explains how to properly set up `.env` files for Google authentication.

## Quick Setup

### Frontend (.env file)

1. **Create a `.env` file** in the `myApp` folder (same level as `package.json`)

2. **Add your Google Client ID**:
   ```
   EXPO_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id_here
   ```

3. **Example**:
   ```
   EXPO_PUBLIC_GOOGLE_CLIENT_ID=123456789-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com
   ```

4. **Restart your Expo server** after creating/updating the file

### Backend (.env file)

1. **Create a `.env` file** in the `myApp/backend` folder (same level as `package.json`)

2. **Add your Google Client ID**:
   ```
   GOOGLE_CLIENT_ID=your_google_client_id_here
   ```

3. **Example**:
   ```
   GOOGLE_CLIENT_ID=123456789-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com
   ```

4. **Restart your backend server** after creating/updating the file

## Important Notes

### For Expo (Frontend)
- ✅ Environment variables **must** start with `EXPO_PUBLIC_` to be accessible in the app
- ✅ Expo SDK 54+ automatically loads `.env` files
- ✅ No additional packages needed
- ✅ **Restart required**: Always restart your Expo server after changing `.env`

### For Backend
- ✅ Uses `dotenv` package (already installed)
- ✅ Automatically loads `.env` from the `backend` folder
- ✅ **Restart required**: Always restart your backend server after changing `.env`

## File Structure

```
myApp/
├── .env                    ← Create this file (frontend)
├── package.json
├── app/
└── backend/
    ├── .env                ← Create this file (backend)
    ├── package.json
    └── index.js
```

## Verification

### Check if Frontend .env is loaded:
1. Add a console.log in `myApp/utils/googleAuth.ts` (temporarily):
   ```typescript
   console.log('Google Client ID loaded:', process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ? 'YES' : 'NO');
   ```

2. Check the Expo console when you start the app

### Check if Backend .env is loaded:
1. The backend will log an error if Client ID is not configured
2. Check the backend console when you start the server

## Troubleshooting

### Frontend: "Google Client ID not configured"
- ✅ Make sure `.env` file exists in `myApp` folder
- ✅ Check the variable name is exactly `EXPO_PUBLIC_GOOGLE_CLIENT_ID`
- ✅ Make sure there are no spaces around the `=` sign
- ✅ Restart your Expo server
- ✅ Check the Expo console for any errors

### Backend: "Server configuration error"
- ✅ Make sure `.env` file exists in `myApp/backend` folder
- ✅ Check the variable name is exactly `GOOGLE_CLIENT_ID`
- ✅ Make sure there are no spaces around the `=` sign
- ✅ Restart your backend server
- ✅ Check the backend console for any errors

### Environment variable not loading
- ✅ Make sure the file is named exactly `.env` (not `.env.txt` or `.env.example`)
- ✅ Make sure the file is in the correct folder
- ✅ Check for typos in the variable name
- ✅ Make sure you restarted the server after creating/updating the file
- ✅ For Expo: Variables must start with `EXPO_PUBLIC_`

## Security

⚠️ **Never commit `.env` files to version control!**

The `.env` files contain sensitive configuration. Make sure they are in `.gitignore`:

```
# .gitignore
.env
.env.local
.env.*.local
```

## Example .env Files

### Frontend (`myApp/.env`)
```env
# Google OAuth Configuration
EXPO_PUBLIC_GOOGLE_CLIENT_ID=123456789-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com
```

### Backend (`myApp/backend/.env`)
```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com

# Optional: Server Configuration
# PORT=5000
# MONGO_URI=mongodb://localhost:27017/issuesence
```

## Getting Your Google Client ID

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create or select a project
3. Click "Create Credentials" > "OAuth client ID"
4. Select "Web application"
5. Copy the Client ID
6. Use the **same Client ID** for both frontend and backend

