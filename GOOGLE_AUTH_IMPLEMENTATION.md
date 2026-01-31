# Google Authentication Implementation

## Overview
Added Google OAuth authentication to the RUBY College Alumni application using Firebase Authentication.

## Changes Made

### 1. Updated `src/lib/auth.tsx`

**Added Imports:**
```typescript
import {
  signInWithPopup,
  GoogleAuthProvider,
  // ... other imports
} from 'firebase/auth';
```

**Added to AuthContextType:**
```typescript
signInWithGoogle: () => Promise<{ error: Error | null }>;
```

**Implemented signInWithGoogle Function:**
```typescript
const signInWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    const { user: firebaseUser } = await signInWithPopup(auth, provider);
    
    // Check if profile exists, if not create one
    const existingProfile = await profileDB.getByUserId(firebaseUser.uid);
    
    if (!existingProfile) {
      const newProfile = {
        user_id: firebaseUser.uid,
        full_name: firebaseUser.displayName || '',
        email_address: firebaseUser.email || '',
        profile_picture_url: firebaseUser.photoURL || null,
        approval_status: 'pending',
        is_complete: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      await profileDB.create(newProfile);
    }
    
    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
};
```

### 2. Updated `src/pages/Auth.tsx`

**Added Google Sign-In Handler:**
```typescript
const handleGoogleSignIn = async () => {
  setIsLoading(true);
  try {
    const { error } = await signInWithGoogle();
    if (error) {
      toast({
        title: 'Google Sign-In Failed',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Welcome!',
        description: 'Successfully signed in with Google.',
      });
    }
  } catch (error) {
    toast({
      title: 'Error',
      description: 'An unexpected error occurred. Please try again.',
      variant: 'destructive',
    });
  } finally {
    setIsLoading(false);
  }
};
```

**Added Google Sign-In Button to UI:**
- Added a divider with "Or continue with" text
- Added a button with Google logo and branding
- Button appears on both sign-in and sign-up pages
- Hidden on the forgot password page

## Features

### Automatic Profile Creation
- When a user signs in with Google for the first time, a profile is automatically created
- Profile is pre-populated with:
  - Full name from Google account
  - Email address
  - Profile picture URL
  - Default approval status: 'pending'
  - Profile marked as incomplete (user needs to fill additional details)

### User Experience
1. User clicks "Sign in with Google" button
2. Google OAuth popup appears
3. User selects their Google account
4. If first-time user:
   - Profile is created in Firestore
   - User is redirected to profile setup page
5. If returning user:
   - User is signed in
   - Redirected to dashboard (if profile complete) or profile setup (if incomplete)

## Firebase Console Setup Required

To enable Google authentication, you must configure it in the Firebase Console:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Authentication** > **Sign-in method**
4. Click on **Google** provider
5. Click **Enable**
6. Add your project's authorized domains:
   - `localhost` (for development)
   - Your production domain (e.g., `your-app.com`)
7. Click **Save**

### Optional: Customize OAuth Consent Screen
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project
3. Navigate to **APIs & Services** > **OAuth consent screen**
4. Configure:
   - App name: "RUBY College Alumni"
   - User support email
   - App logo (optional)
   - Authorized domains
   - Developer contact information

## Security Considerations

### Profile Approval
- New Google sign-in users have `approval_status: 'pending'`
- Admins must approve users before they can access full features
- This prevents unauthorized access via Google accounts

### Data Privacy
- Only basic profile information is requested from Google:
  - Display name
  - Email address
  - Profile picture URL
- No additional scopes are requested

## Testing

### Test Google Sign-In:
1. Ensure Firebase is installed: `npm install firebase`
2. Start the dev server: `npm run dev`
3. Navigate to the auth page
4. Click "Sign in with Google"
5. Select a Google account
6. Verify profile creation in Firestore
7. Check that user is redirected appropriately

### Test Scenarios:
- [ ] First-time Google sign-in creates profile
- [ ] Returning Google user signs in successfully
- [ ] Profile picture from Google is saved
- [ ] User is redirected to profile setup if incomplete
- [ ] User is redirected to dashboard if profile complete
- [ ] Error handling works (e.g., popup blocked, network error)

## Troubleshooting

### Common Issues:

**1. "Popup blocked" error**
- User's browser is blocking popups
- Solution: Ask user to allow popups for your domain

**2. "This app is not verified" warning**
- Appears during development
- Solution: Click "Advanced" > "Go to [app name] (unsafe)" for testing
- For production: Submit app for verification in Google Cloud Console

**3. "Unauthorized domain" error**
- Domain not added to Firebase authorized domains
- Solution: Add domain in Firebase Console > Authentication > Settings

**4. Profile not created**
- Check Firestore security rules
- Verify `profileDB.create()` has proper permissions
- Check browser console for errors

## Next Steps

1. **Install Firebase** (if not already done):
   ```bash
   npm install firebase
   ```

2. **Enable Google Auth in Firebase Console** (see setup instructions above)

3. **Test the implementation**

4. **Optional Enhancements:**
   - Add other OAuth providers (Facebook, GitHub, etc.)
   - Implement account linking (link Google account to existing email/password account)
   - Add "Sign in with Google" to mobile view
   - Customize Google button styling

## Benefits of Google Authentication

- **Better UX**: One-click sign-in, no password to remember
- **Security**: Leverages Google's security infrastructure
- **Trust**: Users trust Google authentication
- **Reduced friction**: Faster onboarding for new users
- **Profile data**: Automatic profile picture and name

## Code Location

- **Auth Provider**: `src/lib/auth.tsx`
- **Auth Page**: `src/pages/Auth.tsx`
- **Firebase Config**: `src/lib/firebase.ts`
- **Database Layer**: `src/lib/firebaseDB.ts`
