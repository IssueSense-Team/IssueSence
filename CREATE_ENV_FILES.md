# How to Create .env Files

## Step-by-Step Instructions

### Frontend .env File

1. **Navigate to the myApp folder**:
   ```
   cd myApp
   ```

2. **Create a new file named `.env`** (note the dot at the beginning)

   **On Windows (PowerShell):**
   ```powershell
   New-Item -Path .env -ItemType File
   ```

   **On Windows (Command Prompt):**
   ```cmd
   type nul > .env
   ```

   **On Mac/Linux:**
   ```bash
   touch .env
   ```

3. **Open the `.env` file** in a text editor

4. **Add this line** (replace with your actual Client ID):
   ```
   EXPO_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id_here
   ```

5. **Save the file**

6. **Restart your Expo server**

### Backend .env File

1. **Navigate to the backend folder**:
   ```
   cd myApp/backend
   ```

2. **Create a new file named `.env`**

   **On Windows (PowerShell):**
   ```powershell
   New-Item -Path .env -ItemType File
   ```

   **On Windows (Command Prompt):**
   ```cmd
   type nul > .env
   ```

   **On Mac/Linux:**
   ```bash
   touch .env
   ```

3. **Open the `.env` file** in a text editor

4. **Add this line** (replace with your actual Client ID):
   ```
   GOOGLE_CLIENT_ID=your_google_client_id_here
   ```

5. **Save the file**

6. **Restart your backend server**

## Using a Text Editor

If you prefer using a text editor:

1. Open your code editor (VS Code, Notepad++, etc.)
2. Create a new file
3. Save it as `.env` (make sure it's exactly `.env`, not `.env.txt`)
4. Add the environment variables
5. Save the file in the correct folder

## Verification

After creating the files, you should see:

**Frontend console (when starting Expo):**
```
✅ Google Client ID loaded from environment
```

**Backend console (when starting server):**
```
✅ Google Client ID loaded from .env
```

If you see warnings instead, check:
- File is named exactly `.env` (not `.env.txt`)
- File is in the correct folder
- Variable names are correct
- No extra spaces around the `=` sign
- You restarted the server

## Example .env File Content

### Frontend (`myApp/.env`)
```env
EXPO_PUBLIC_GOOGLE_CLIENT_ID=123456789-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com
```

### Backend (`myApp/backend/.env`)
```env
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com
```

## Important Notes

- ✅ The file must be named exactly `.env` (with the dot)
- ✅ No file extension (not `.env.txt` or `.env.example`)
- ✅ Place it in the correct folder:
  - Frontend: `myApp/.env`
  - Backend: `myApp/backend/.env`
- ✅ Use the same Google Client ID for both files
- ✅ Always restart your servers after creating/updating `.env` files

