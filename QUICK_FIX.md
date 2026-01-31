# Quick Fix: Install Firebase Manually

## Your .env is now updated! ✅

The Firebase configuration has been successfully updated in your `.env` file.

## Problem: NPM is hanging

NPM install commands keep hanging. Here's the fastest way to fix this:

## Solution: Manual Steps

### Step 1: Kill all Node/NPM processes

Open **Task Manager** (Ctrl+Shift+Esc) and end these processes:
- `node.exe`
- `npm.exe`  
- `Code.exe` (VS Code - close it completely)

### Step 2: Open a NEW Command Prompt as Administrator

Right-click Command Prompt → Run as Administrator

### Step 3: Navigate to your project

```cmd
cd "c:\Users\MANI\Documents\GitHub\RUBY COLLEGE"
```

### Step 4: Clean everything

```cmd
npm cache clean --force
rmdir /s /q node_modules
del package-lock.json
```

### Step 5: Install Firebase

```cmd
npm install firebase@11.2.0 --legacy-peer-deps --verbose
```

**Watch the output!** If it hangs at a specific package, note which one.

### Step 6: If still hanging, try this:

```cmd
npm config set fetch-timeout 60000
npm config set fetch-retries 5
npm install firebase@11.2.0 --legacy-peer-deps
```

### Step 7: Start the dev server

```cmd
npm run dev
```

## Alternative: Use pnpm (Faster & More Reliable)

If npm continues to fail:

```cmd
npm install -g pnpm
pnpm install firebase
pnpm run dev
```

## What to Expect After Installation

Once Firebase is installed, you should see:

1. **Dev server starts successfully** at http://localhost:2030
2. **No more "Failed to resolve import firebase/auth" errors**
3. **Auth page loads** with:
   - Email/Password sign-in form
   - **Google Sign-In button** (new!)
4. **Google OAuth works** when you click the button

## Enable Google Sign-In in Firebase Console

Don't forget to enable Google authentication:

1. Go to https://console.firebase.google.com/
2. Select project: **gauth-dc27e**
3. Click **Authentication** → **Sign-in method**
4. Click **Google** → **Enable**
5. Add authorized domain: `localhost`
6. Click **Save**

## Test Google Sign-In

1. Open http://localhost:2030/auth
2. Click "Sign in with Google" button
3. Select your Google account
4. Should create profile and redirect to profile setup

## Your Firebase Config (Updated)

```
Project ID: gauth-dc27e
Auth Domain: gauth-dc27e.firebaseapp.com
Storage Bucket: gauth-dc27e.firebasestorage.app
```

## If You're Still Stuck

Try these diagnostics:

```cmd
# Check npm is working
npm --version

# Check internet
ping registry.npmjs.org

# Check for proxy
npm config get proxy
npm config get https-proxy

# Try different registry
npm config set registry https://registry.npmmirror.com
npm install firebase
```

## Last Resort: Download Firebase Manually

1. Download from: https://registry.npmjs.org/firebase/-/firebase-11.2.0.tgz
2. Save to Downloads folder
3. Install:
   ```cmd
   npm install "%USERPROFILE%\Downloads\firebase-11.2.0.tgz"
   ```

---

**Once Firebase installs, everything is ready to go!** All the code for Firebase migration and Google Auth is already implemented. 🚀
