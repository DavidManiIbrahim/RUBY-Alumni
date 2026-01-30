# Supabase to Redis Migration - Complete Removal Guide

## ✅ Step 1: Dependencies Removed

- ✅ Removed `@supabase/supabase-js` from `package.json`
- ✅ Removed Firebase import from `main.tsx`

## 📋 Files That Need Updates

### Critical Files (Auth & Core)
1. ✅ `src/lib/auth.tsx` - Replace with `src/lib/authRedis.tsx`
2. `src/pages/ResetPassword.tsx` - Update password reset logic
3. `src/pages/ProfileSetup.tsx` - Update profile creation
4. `src/pages/Profile.tsx` - Update profile management

### Data Pages
5. `src/pages/Directory.tsx` - Update alumni directory
6. `src/pages/Dashboard.tsx` - Update dashboard stats
7. `src/pages/Announcements.tsx` - Update announcements
8. `src/pages/Gallery.tsx` - Update gallery
9. `src/pages/Chat.tsx` - Update chat
10. `src/pages/AlumniProfile.tsx` - Update profile viewing
11. `src/pages/Admin.tsx` - Update admin panel

### Integration Files to Remove
- `src/integrations/supabase/client.ts`
- `src/integrations/supabase/types.ts`
- Any other files in `src/integrations/supabase/`

## 🔄 Migration Strategy

### Option 1: Quick Switch (Recommended)

Update `src/App.tsx` to use Redis auth:

```typescript
// Find and replace
import { AuthProvider } from '@/lib/auth';
// With
import { AuthProvider } from '@/lib/authRedis';
```

### Option 2: Gradual Migration

Keep both systems temporarily and migrate page by page.

## 📝 Common Replacements

### Authentication

**Before (Supabase):**
```typescript
import { supabase } from '@/integrations/supabase/client';

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password
});

// Get session
const { data: { session } } = await supabase.auth.getSession();

// Update password
await supabase.auth.updateUser({ password: newPassword });
```

**After (Redis):**
```typescript
import auth from '@/lib/redisAuth';
import { useAuth } from '@/lib/authRedis';

// Sign in
const { user, session, error } = await auth.signIn(email, password);

// Get session (from context)
const { user, session } = useAuth();

// Update password
await auth.updatePassword(userId, currentPassword, newPassword);
```

### Database Queries

**Before (Supabase):**
```typescript
// Get profiles
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('approval_status', 'approved');

// Update profile
await supabase
  .from('profiles')
  .update({ bio: 'New bio' })
  .eq('user_id', userId);

// Create announcement
await supabase
  .from('announcements')
  .insert({ title, content, user_id });
```

**After (Redis):**
```typescript
import { profileDB, announcementDB } from '@/lib/redisDB';
// Or use hooks
import { useProfiles, useAnnouncements } from '@/hooks/useRedisDB';

// Get profiles
const profiles = await profileDB.getAll({ approval_status: 'approved' });
// Or with hook
const { profiles } = useProfiles({ approval_status: 'approved' });

// Update profile
await profileDB.update(userId, { bio: 'New bio' });

// Create announcement
await announcementDB.create({ title, content, user_id });
```

### File Storage

**Before (Supabase):**
```typescript
// Upload
const { error } = await supabase.storage
  .from('profile-pictures')
  .upload(`${userId}/${file.name}`, file);

// Get URL
const { data: { publicUrl } } = supabase.storage
  .from('profile-pictures')
  .getPublicUrl(filePath);
```

**After (Redis):**
```typescript
import storage from '@/lib/redisStorage';

// Upload
const { data, error } = await storage.upload(
  'profile-pictures',
  file,
  userId
);

// Get data URL
const dataURL = storage.createDataURL(data);
// Or
const dataURL = await storage.getFileDataURL('profile-pictures', fileId);
```

### Real-time Subscriptions

**Before (Supabase):**
```typescript
const channel = supabase
  .channel('announcements')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'announcements' },
    (payload) => {
      // Handle update
    }
  )
  .subscribe();

// Cleanup
supabase.removeChannel(channel);
```

**After (Redis):**
```typescript
// Option 1: Polling
import { useRealtimeUpdates } from '@/hooks/useRedisDB';

const { data: announcements } = useRealtimeUpdates(
  () => announcementDB.getAll(),
  5000 // Poll every 5 seconds
);

// Option 2: Manual refresh
const { announcements, refetch } = useAnnouncements();
// Call refetch() when needed
```

## 🗂️ File-by-File Migration

### 1. Update App.tsx

```typescript
// Change auth provider
import { AuthProvider } from '@/lib/authRedis';
```

### 2. Update ResetPassword.tsx

```typescript
import { useAuth } from '@/lib/authRedis';
import auth from '@/lib/redisAuth';

// In component
const { user } = useAuth();

// Reset password
const handleReset = async () => {
  const token = new URLSearchParams(window.location.search).get('token');
  if (token) {
    const { error } = await auth.resetPassword(token, newPassword);
  }
};
```

### 3. Update ProfileSetup.tsx

```typescript
import { useAuth } from '@/lib/authRedis';
import { profileDB } from '@/lib/redisDB';
import storage from '@/lib/redisStorage';

// Upload profile picture
const { data: fileData } = await storage.upload(
  'profile-pictures',
  file,
  user.id
);

// Create profile
await profileDB.create({
  user_id: user.id,
  full_name,
  email_address: email,
  profile_picture_url: storage.createDataURL(fileData),
  // ... other fields
});
```

### 4. Update Profile.tsx

```typescript
import { useProfile } from '@/hooks/useRedisDB';
import storage from '@/lib/redisStorage';

const { profile, updateProfile } = useProfile(user?.id);

// Update profile
await updateProfile({ bio: 'New bio' });

// Upload new picture
const { data } = await storage.upload('profile-pictures', file, user.id);
await updateProfile({ profile_picture_url: storage.createDataURL(data) });
```

### 5. Update Directory.tsx

```typescript
import { useProfiles } from '@/hooks/useRedisDB';

const { profiles, loading } = useProfiles({ approval_status: 'approved' });

// Search
const filteredProfiles = profiles.filter(p =>
  p.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
);
```

### 6. Update Dashboard.tsx

```typescript
import { useAnnouncements, useProfiles } from '@/hooks/useRedisDB';

const { announcements } = useAnnouncements(5); // Latest 5
const { profiles } = useProfiles({ approval_status: 'approved' });

// Stats
const totalAlumni = profiles.length;
const recentAnnouncements = announcements.slice(0, 5);
```

### 7. Update Announcements.tsx

```typescript
import { useAnnouncements } from '@/hooks/useRedisDB';

const { 
  announcements, 
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement 
} = useAnnouncements();

// Create
await createAnnouncement({
  title: 'New Announcement',
  content: 'Content here',
  user_id: user.id
});
```

### 8. Update Gallery.tsx

```typescript
import { useGallery } from '@/hooks/useRedisDB';
import storage from '@/lib/redisStorage';

const { gallery, createGalleryItem, deleteGalleryItem } = useGallery();

// Upload image
const { data: fileData } = await storage.upload('gallery', file, user.id);

// Create gallery item
await createGalleryItem({
  url: storage.createDataURL(fileData),
  caption: 'My photo',
  user_id: user.id,
  media_type: 'image'
});
```

### 9. Update Chat.tsx

```typescript
import { useChatMessages } from '@/hooks/useRedisDB';

const { messages, sendMessage, refetch } = useChatMessages();

// Send message
await sendMessage({
  content: messageText,
  user_id: user.id
});

// Poll for new messages
useEffect(() => {
  const interval = setInterval(refetch, 3000);
  return () => clearInterval(interval);
}, [refetch]);
```

### 10. Update Admin.tsx

```typescript
import { useProfiles, useAnnouncements } from '@/hooks/useRedisDB';
import { profileDB, roleDB } from '@/lib/redisDB';

const { profiles, refetch } = useProfiles();

// Approve user
await profileDB.update(userId, { approval_status: 'approved' });
await refetch();

// Set admin role
await roleDB.setRole(userId, 'admin');
```

## 🗑️ Files to Delete

After migration is complete:

```bash
# Delete Supabase integration folder
rm -rf src/integrations/supabase

# Delete old auth file (after confirming authRedis works)
rm src/lib/auth.tsx

# Uninstall Supabase
npm uninstall @supabase/supabase-js
```

## ✅ Testing Checklist

- [ ] Authentication (signup, login, logout)
- [ ] Password reset
- [ ] Profile creation and updates
- [ ] Profile picture upload
- [ ] Directory listing and search
- [ ] Announcements CRUD
- [ ] Gallery upload and delete
- [ ] Chat messaging
- [ ] Admin functions
- [ ] Role management

## 🚀 Quick Migration Commands

```bash
# 1. Remove Supabase dependency
npm uninstall @supabase/supabase-js

# 2. Install dependencies (if not done)
npm install

# 3. Update environment variables
# Make sure VITE_REDIS_URL is set in .env

# 4. Start dev server
npm run dev
```

## 📊 Migration Progress

| File | Status | Priority |
|------|--------|----------|
| package.json | ✅ Done | High |
| main.tsx | ✅ Done | High |
| App.tsx | ⏳ Pending | High |
| authRedis.tsx | ✅ Created | High |
| redisDB.ts | ✅ Created | High |
| redisAuth.ts | ✅ Created | High |
| redisStorage.ts | ✅ Created | High |
| useRedisDB.ts | ✅ Created | High |
| ResetPassword.tsx | ⏳ Pending | Medium |
| ProfileSetup.tsx | ⏳ Pending | High |
| Profile.tsx | ⏳ Pending | High |
| Directory.tsx | ⏳ Pending | High |
| Dashboard.tsx | ⏳ Pending | Medium |
| Announcements.tsx | ⏳ Pending | Medium |
| Gallery.tsx | ⏳ Pending | Medium |
| Chat.tsx | ⏳ Pending | Medium |
| Admin.tsx | ⏳ Pending | High |

## 💡 Tips

1. **Start with Auth**: Update App.tsx to use authRedis first
2. **Test Each Page**: Migrate and test one page at a time
3. **Keep Backups**: Commit changes frequently
4. **Use Hooks**: Prefer useRedisDB hooks over direct DB calls
5. **Monitor Console**: Watch for errors during migration

---

**Status**: Migration guide created
**Next Step**: Update App.tsx to use authRedis
**Documentation**: See REDIS_PRIMARY_DATABASE_SUMMARY.md
