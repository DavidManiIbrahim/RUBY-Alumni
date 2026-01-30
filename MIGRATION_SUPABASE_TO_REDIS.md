# Migration Guide: Supabase to Redis

## Overview

This guide will help you migrate your application from Supabase to Redis as the primary database.

## ⚠️ Important Notes

### What Changes
- ✅ **Database**: Supabase PostgreSQL → Redis
- ✅ **Authentication**: Supabase Auth → Custom Redis Auth
- ✅ **File Storage**: Supabase Storage → Redis Base64 Storage
- ✅ **Real-time**: Supabase Realtime → Manual polling or WebSockets

### What You Need
- ✅ Redis instance (Railway Redis already configured)
- ✅ Password hashing library (bcryptjs - already added)
- ✅ Session management (implemented in Redis)

## 📦 New Dependencies Added

```json
{
  "redis": "^4.7.0",
  "bcryptjs": "^2.4.3",
  "@types/bcryptjs": "^2.4.6"
}
```

## 🗂️ New Files Created

### Core Redis Files
1. **`src/lib/redis.ts`** - Redis client and cache utilities
2. **`src/lib/redisDB.ts`** - Database operations (CRUD for all entities)
3. **`src/lib/redisAuth.ts`** - Authentication system
4. **`src/lib/redisStorage.ts`** - File storage system
5. **`src/lib/authRedis.tsx`** - Auth context for React

### Cache Layer (Optional - for optimization)
6. **`src/lib/cachedSupabase.ts`** - Can be adapted for Redis
7. **`src/hooks/useCache.ts`** - React hooks for caching

## 🔄 Migration Steps

### Step 1: Install Dependencies

```bash
npm install
```

This will install `redis`, `bcryptjs`, and type definitions.

### Step 2: Update Environment Variables

Your `.env` is already configured with Railway Redis:

```bash
VITE_REDIS_URL=redis://default:XPIEVdRqCDDdYtkkbbGCVpfscBlsdTvs@yamabiko.proxy.rlwy.net:16343
```

### Step 3: Replace Auth Context

**Option A: Quick Switch (Recommended for testing)**

In `src/main.tsx`, update the import:

```typescript
// Before
import { AuthProvider } from '@/lib/auth';

// After
import { AuthProvider } from '@/lib/authRedis';
```

**Option B: Gradual Migration**

Keep both auth systems and switch page by page.

### Step 4: Update Database Calls

Replace Supabase queries with Redis database operations:

#### Profiles

**Before (Supabase):**
```typescript
const { data } = await supabase
  .from('profiles')
  .select('*')
  .eq('user_id', userId)
  .single();
```

**After (Redis):**
```typescript
import { profileDB } from '@/lib/redisDB';

const profile = await profileDB.getByUserId(userId);
```

#### Announcements

**Before (Supabase):**
```typescript
const { data } = await supabase
  .from('announcements')
  .select('*')
  .order('created_at', { ascending: false });
```

**After (Redis):**
```typescript
import { announcementDB } from '@/lib/redisDB';

const announcements = await announcementDB.getAll();
```

#### Gallery

**Before (Supabase):**
```typescript
const { data } = await supabase
  .from('gallery')
  .select('*')
  .order('created_at', { ascending: false });
```

**After (Redis):**
```typescript
import { galleryDB } from '@/lib/redisDB';

const gallery = await galleryDB.getAll();
```

### Step 5: Update File Uploads

Replace Supabase Storage with Redis Storage:

**Before (Supabase):**
```typescript
const { data, error } = await supabase.storage
  .from('profile-pictures')
  .upload(`${userId}/${file.name}`, file);
```

**After (Redis):**
```typescript
import storage from '@/lib/redisStorage';

const { data, error } = await storage.upload(
  'profile-pictures',
  file,
  userId
);

// Get data URL for display
const dataURL = storage.createDataURL(data);
```

### Step 6: Update Image Display

Since files are now stored as base64, update image sources:

**Before (Supabase):**
```typescript
<img src={profile.profile_picture_url} />
```

**After (Redis):**
```typescript
import storage from '@/lib/redisStorage';

// If storing full data URL
<img src={profile.profile_picture_url} />

// If storing file ID, fetch the data URL
const [imageURL, setImageURL] = useState('');

useEffect(() => {
  const loadImage = async () => {
    const url = await storage.getFileDataURL('profile-pictures', fileId);
    if (url) setImageURL(url);
  };
  loadImage();
}, [fileId]);

<img src={imageURL} />
```

### Step 7: Remove Supabase Dependencies (Optional)

After migration is complete and tested:

```bash
npm uninstall @supabase/supabase-js
```

Remove Supabase files:
- `src/integrations/supabase/client.ts`
- `src/integrations/supabase/types.ts`

## 📝 API Reference

### Database Operations

```typescript
import db from '@/lib/redisDB';

// Initialize database
await db.init();

// Users
const user = await db.users.create({ email, password_hash, full_name });
const user = await db.users.getById(userId);
const user = await db.users.getByEmail(email);
const users = await db.users.getAll();
await db.users.update(userId, { full_name: 'New Name' });
await db.users.delete(userId);

// Profiles
const profile = await db.profiles.create({ user_id, full_name, email_address });
const profile = await db.profiles.getByUserId(userId);
const profiles = await db.profiles.getAll({ approval_status: 'approved' });
const profiles = await db.profiles.search('John');
await db.profiles.update(userId, { bio: 'New bio' });
await db.profiles.delete(userId);

// Announcements
const announcement = await db.announcements.create({ title, content, user_id });
const announcement = await db.announcements.getById(id);
const announcements = await db.announcements.getAll(50); // limit
await db.announcements.update(id, { title: 'Updated' });
await db.announcements.delete(id);

// Gallery
const item = await db.gallery.create({ url, caption, user_id });
const item = await db.gallery.getById(id);
const items = await db.gallery.getAll();
const userItems = await db.gallery.getByUserId(userId);
await db.gallery.update(id, { caption: 'New caption' });
await db.gallery.delete(id);

// Chat Messages
const message = await db.chat.create({ content, user_id });
const messages = await db.chat.getAll(100);
await db.chat.delete(id);

// Roles
await db.roles.setRole(userId, 'admin');
const role = await db.roles.getRole(userId);
const isAdmin = await db.roles.isAdmin(userId);
await db.roles.removeRole(userId);

// Audit Logs
const log = await db.audit.create({ action, user_id, metadata });
const logs = await db.audit.getAll(100);

// Counters
await db.counters.increment('page_views');
await db.counters.decrement('active_users');
const count = await db.counters.get('total_users');
await db.counters.set('total_users', 100);
```

### Authentication

```typescript
import auth from '@/lib/redisAuth';

// Sign up
const { user, session, error } = await auth.signUp(email, password, fullName);

// Sign in
const { user, session, error } = await auth.signIn(email, password);

// Sign out
await auth.signOut(sessionId);

// Password reset
const { error, resetToken } = await auth.resetPasswordRequest(email);
await auth.resetPassword(resetToken, newPassword);

// Update password
await auth.updatePassword(userId, currentPassword, newPassword);

// Get user
const user = await auth.getUser(userId);

// Verify email
await auth.verifyEmail(userId);
```

### File Storage

```typescript
import storage from '@/lib/redisStorage';

// Upload file
const { data, error } = await storage.upload('bucket-name', file, userId);

// Upload from data URL
const { data, error } = await storage.uploadFromDataURL(
  'bucket-name',
  dataURL,
  'filename.jpg',
  userId
);

// Get file
const file = await storage.getFile('bucket-name', fileId);

// Get as data URL
const dataURL = await storage.getFileDataURL('bucket-name', fileId);

// Delete file
await storage.deleteFile('bucket-name', fileId, userId);

// List files
const files = await storage.listFiles('bucket-name', 50);
const userFiles = await storage.listUserFiles(userId, 50);

// Create data URL from file object
const dataURL = storage.createDataURL(fileObject);
```

## 🔍 Key Differences

### Data Structure

**Supabase (PostgreSQL):**
- Relational tables with foreign keys
- SQL queries with joins
- Automatic timestamps

**Redis:**
- Key-value store with JSON values
- Manual relationship management
- Manual timestamp handling

### Querying

**Supabase:**
```typescript
const { data } = await supabase
  .from('profiles')
  .select('*')
  .eq('graduation_year', 2020)
  .order('full_name');
```

**Redis:**
```typescript
const profiles = await profileDB.getAll({ graduation_year: 2020 });
profiles.sort((a, b) => a.full_name.localeCompare(b.full_name));
```

### Real-time Updates

**Supabase:**
```typescript
supabase
  .channel('announcements')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, 
    payload => console.log(payload))
  .subscribe();
```

**Redis:**
```typescript
// Option 1: Polling
setInterval(async () => {
  const announcements = await announcementDB.getAll();
  // Update state
}, 5000);

// Option 2: Implement pub/sub (advanced)
// Use Redis pub/sub for real-time updates
```

## ⚡ Performance Considerations

### Advantages
- ✅ **Faster reads**: In-memory data access
- ✅ **Simpler queries**: Direct key-value access
- ✅ **Lower latency**: No network round-trips to PostgreSQL

### Limitations
- ⚠️ **Memory usage**: All data in RAM
- ⚠️ **Complex queries**: Manual filtering and sorting
- ⚠️ **Data persistence**: Requires Redis persistence configuration
- ⚠️ **File storage**: 5MB limit per file (base64 in Redis)

## 🔒 Data Persistence

Ensure Redis persistence is enabled:

**Redis Configuration (redis.conf):**
```conf
# Save snapshots
save 900 1      # After 900 sec if at least 1 key changed
save 300 10     # After 300 sec if at least 10 keys changed
save 60 10000   # After 60 sec if at least 10000 keys changed

# Enable AOF (Append Only File)
appendonly yes
appendfsync everysec
```

**Railway Redis** already has persistence enabled by default.

## 🧪 Testing

### Test Authentication
```typescript
// Sign up
const { error } = await auth.signUp('test@example.com', 'password123', 'Test User');

// Sign in
const { user, session, error } = await auth.signIn('test@example.com', 'password123');

// Verify session
const savedSession = await auth.getSession(session.id);
```

### Test Database Operations
```typescript
// Create profile
const profile = await profileDB.create({
  user_id: user.id,
  full_name: 'Test User',
  email_address: 'test@example.com',
  approval_status: 'pending'
});

// Fetch profile
const fetched = await profileDB.getByUserId(user.id);
console.log(fetched);
```

## 📊 Data Migration (If you have existing data)

If you have existing data in Supabase, you'll need to migrate it:

```typescript
// Example migration script
import { supabase } from '@/integrations/supabase/client';
import db from '@/lib/redisDB';

async function migrateData() {
  // Migrate profiles
  const { data: profiles } = await supabase.from('profiles').select('*');
  for (const profile of profiles) {
    await db.profiles.create(profile);
  }

  // Migrate announcements
  const { data: announcements } = await supabase.from('announcements').select('*');
  for (const announcement of announcements) {
    await db.announcements.create(announcement);
  }

  // ... migrate other tables
}
```

## 🚀 Deployment

### Environment Variables

Ensure `VITE_REDIS_URL` is set in production:

```bash
VITE_REDIS_URL=rediss://your-production-redis-url
```

### Redis Hosting Options

1. **Railway** (current setup) ✅
2. **Upstash** - Serverless Redis
3. **Redis Cloud** - Managed Redis
4. **AWS ElastiCache**
5. **Azure Cache for Redis**

## 📞 Support

If you encounter issues:
1. Check Redis connection: `redis-cli ping`
2. Verify environment variables
3. Check browser console for errors
4. Review Redis logs

## ✅ Checklist

- [ ] Install dependencies (`npm install`)
- [ ] Update auth context import
- [ ] Replace database queries
- [ ] Update file upload logic
- [ ] Test authentication flow
- [ ] Test data operations
- [ ] Configure Redis persistence
- [ ] Deploy to production

---

**Migration Status**: Ready for implementation
**Estimated Time**: 2-4 hours for full migration
**Difficulty**: Moderate
