import { redisClient, initRedis } from './redis';
import type {
    User,
    UserCreate,
    UserUpdate,
    Profile,
    ProfileCreate,
    ProfileUpdate,
    ProfileFilters,
    Announcement,
    AnnouncementCreate,
    AnnouncementUpdate,
    GalleryItem,
    GalleryItemCreate,
    GalleryItemUpdate,
    ChatMessage,
    ChatMessageCreate,
    AuditLog,
    AuditLogCreate,
} from './redisTypes';

/**
 * Redis Database Layer
 * Using Redis as the primary database instead of Supabase
 */

// Initialize Redis connection
export const initDB = async () => {
    await initRedis();
};

// Database key patterns
export const DBKeys = {
    // Users
    user: (userId: string) => `user:${userId}`,
    userByEmail: (email: string) => `user:email:${email}`,
    users: () => 'users:all',

    // Profiles
    profile: (userId: string) => `profile:${userId}`,
    profiles: () => 'profiles:all',

    // Sessions
    session: (sessionId: string) => `session:${sessionId}`,
    userSessions: (userId: string) => `user:${userId}:sessions`,

    // Announcements
    announcement: (id: string) => `announcement:${id}`,
    announcements: () => 'announcements:all',

    // Gallery
    galleryItem: (id: string) => `gallery:${id}`,
    gallery: () => 'gallery:all',

    // Chat Messages
    chatMessage: (id: string) => `chat:message:${id}`,
    chatMessages: () => 'chat:messages:all',

    // User Roles
    userRole: (userId: string) => `user:${userId}:role`,

    // Audit Logs
    auditLog: (id: string) => `audit:${id}`,
    auditLogs: () => 'audit:logs:all',

    // Counters
    counter: (name: string) => `counter:${name}`,
};

// Helper to generate unique IDs
export const generateId = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// User Operations
export const userDB = {
    async create(userData: UserCreate): Promise<User> {
        const userId = generateId();
        const user = {
            id: userId,
            ...userData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        await redisClient.set(DBKeys.user(userId), JSON.stringify(user));
        await redisClient.set(DBKeys.userByEmail(userData.email), userId);
        await redisClient.sAdd(DBKeys.users(), userId);

        return user;
    },

    async getById(userId: string): Promise<User | null> {
        const data = await redisClient.get(DBKeys.user(userId));
        return data ? JSON.parse(data) as User : null;
    },

    async getByEmail(email: string): Promise<User | null> {
        const userId = await redisClient.get(DBKeys.userByEmail(email));
        if (!userId) return null;
        return await this.getById(userId);
    },

    async update(userId: string, updates: UserUpdate): Promise<User | null> {
        const user = await this.getById(userId);
        if (!user) return null;

        const updated = {
            ...user,
            ...updates,
            updated_at: new Date().toISOString(),
        };

        await redisClient.set(DBKeys.user(userId), JSON.stringify(updated));
        return updated;
    },

    async delete(userId: string) {
        const user = await this.getById(userId);
        if (!user) return false;

        await redisClient.del(DBKeys.user(userId));
        await redisClient.del(DBKeys.userByEmail(user.email));
        await redisClient.sRem(DBKeys.users(), userId);
        return true;
    },

    async getAll(): Promise<User[]> {
        const userIds = await redisClient.sMembers(DBKeys.users());
        const users = await Promise.all(
            userIds.map(id => this.getById(id))
        );
        return users.filter(Boolean);
    },
};

// Profile Operations
export const profileDB = {
    async create(profileData: ProfileCreate): Promise<Profile> {
        const profile = {
            id: generateId(),
            ...profileData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        await redisClient.set(DBKeys.profile(profileData.user_id), JSON.stringify(profile));
        await redisClient.sAdd(DBKeys.profiles(), profileData.user_id);

        return profile;
    },

    async getByUserId(userId: string): Promise<Profile | null> {
        const data = await redisClient.get(DBKeys.profile(userId));
        return data ? JSON.parse(data) as Profile : null;
    },

    async update(userId: string, updates: ProfileUpdate): Promise<Profile | null> {
        const profile = await this.getByUserId(userId);
        if (!profile) return null;

        const updated = {
            ...profile,
            ...updates,
            updated_at: new Date().toISOString(),
        };

        await redisClient.set(DBKeys.profile(userId), JSON.stringify(updated));
        return updated;
    },

    async delete(userId: string) {
        await redisClient.del(DBKeys.profile(userId));
        await redisClient.sRem(DBKeys.profiles(), userId);
        return true;
    },

    async getAll(filters?: ProfileFilters): Promise<Profile[]> {
        const userIds = await redisClient.sMembers(DBKeys.profiles());
        let profiles = await Promise.all(
            userIds.map(id => this.getByUserId(id))
        );

        profiles = profiles.filter(Boolean);

        // Apply filters
        if (filters?.approval_status) {
            profiles = profiles.filter(p => p.approval_status === filters.approval_status);
        }
        if (filters?.graduation_year) {
            profiles = profiles.filter(p => p.graduation_year === filters.graduation_year);
        }

        return profiles;
    },

    async search(query: string): Promise<Profile[]> {
        const profiles = await this.getAll();
        return profiles.filter(p =>
            p.full_name?.toLowerCase().includes(query.toLowerCase())
        );
    },
};

// Announcement Operations
export const announcementDB = {
    async create(announcementData: AnnouncementCreate): Promise<Announcement> {
        const id = generateId();
        const announcement = {
            id,
            ...announcementData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        await redisClient.set(DBKeys.announcement(id), JSON.stringify(announcement));
        await redisClient.zAdd(DBKeys.announcements(), {
            score: Date.now(),
            value: id,
        });

        return announcement;
    },

    async getById(id: string): Promise<Announcement | null> {
        const data = await redisClient.get(DBKeys.announcement(id));
        return data ? JSON.parse(data) as Announcement : null;
    },

    async update(id: string, updates: AnnouncementUpdate): Promise<Announcement | null> {
        const announcement = await this.getById(id);
        if (!announcement) return null;

        const updated = {
            ...announcement,
            ...updates,
            updated_at: new Date().toISOString(),
        };

        await redisClient.set(DBKeys.announcement(id), JSON.stringify(updated));
        return updated;
    },

    async delete(id: string) {
        await redisClient.del(DBKeys.announcement(id));
        await redisClient.zRem(DBKeys.announcements(), id);
        return true;
    },

    async getAll(limit = 100): Promise<Announcement[]> {
        const ids = await redisClient.zRange(DBKeys.announcements(), 0, limit - 1, { REV: true });
        const announcements = await Promise.all(
            ids.map(id => this.getById(id))
        );
        return announcements.filter((a): a is Announcement => a !== null);
    },
};

// Gallery Operations
export const galleryDB = {
    async create(galleryData: GalleryItemCreate): Promise<GalleryItem> {
        const id = generateId();
        const item = {
            id,
            ...galleryData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        await redisClient.set(DBKeys.galleryItem(id), JSON.stringify(item));
        await redisClient.zAdd(DBKeys.gallery(), {
            score: Date.now(),
            value: id,
        });

        return item;
    },

    async getById(id: string): Promise<GalleryItem | null> {
        const data = await redisClient.get(DBKeys.galleryItem(id));
        return data ? JSON.parse(data) as GalleryItem : null;
    },

    async update(id: string, updates: GalleryItemUpdate): Promise<GalleryItem | null> {
        const item = await this.getById(id);
        if (!item) return null;

        const updated = {
            ...item,
            ...updates,
            updated_at: new Date().toISOString(),
        };

        await redisClient.set(DBKeys.galleryItem(id), JSON.stringify(updated));
        return updated;
    },

    async delete(id: string) {
        await redisClient.del(DBKeys.galleryItem(id));
        await redisClient.zRem(DBKeys.gallery(), id);
        return true;
    },

    async getAll(limit = 100): Promise<GalleryItem[]> {
        const ids = await redisClient.zRange(DBKeys.gallery(), 0, limit - 1, { REV: true });
        const items = await Promise.all(
            ids.map(id => this.getById(id))
        );
        return items.filter((item): item is GalleryItem => item !== null);
    },

    async getByUserId(userId: string): Promise<GalleryItem[]> {
        const allItems = await this.getAll();
        return allItems.filter(item => item.user_id === userId);
    },
};

// Chat Message Operations
export const chatDB = {
    async create(messageData: ChatMessageCreate): Promise<ChatMessage> {
        const id = generateId();
        const message = {
            id,
            ...messageData,
            created_at: new Date().toISOString(),
        };

        await redisClient.set(DBKeys.chatMessage(id), JSON.stringify(message));
        await redisClient.zAdd(DBKeys.chatMessages(), {
            score: Date.now(),
            value: id,
        });

        return message;
    },

    async getById(id: string): Promise<ChatMessage | null> {
        const data = await redisClient.get(DBKeys.chatMessage(id));
        return data ? JSON.parse(data) as ChatMessage : null;
    },

    async getAll(limit = 100): Promise<ChatMessage[]> {
        const ids = await redisClient.zRange(DBKeys.chatMessages(), 0, limit - 1);
        const messages = await Promise.all(
            ids.map(id => this.getById(id))
        );
        return messages.filter((msg): msg is ChatMessage => msg !== null);
    },

    async delete(id: string) {
        await redisClient.del(DBKeys.chatMessage(id));
        await redisClient.zRem(DBKeys.chatMessages(), id);
        return true;
    },
};

// User Role Operations
export const roleDB = {
    async setRole(userId: string, role: string) {
        await redisClient.set(DBKeys.userRole(userId), role);
        return true;
    },

    async getRole(userId: string) {
        return await redisClient.get(DBKeys.userRole(userId));
    },

    async isAdmin(userId: string) {
        const role = await this.getRole(userId);
        return role === 'admin';
    },

    async removeRole(userId: string) {
        await redisClient.del(DBKeys.userRole(userId));
        return true;
    },
};

// Audit Log Operations
export const auditDB = {
    async create(logData: AuditLogCreate): Promise<AuditLog> {
        const id = generateId();
        const log = {
            id,
            ...logData,
            created_at: new Date().toISOString(),
        };

        await redisClient.set(DBKeys.auditLog(id), JSON.stringify(log));
        await redisClient.zAdd(DBKeys.auditLogs(), {
            score: Date.now(),
            value: id,
        });

        return log;
    },

    async getAll(limit = 100): Promise<AuditLog[]> {
        const ids = await redisClient.zRange(DBKeys.auditLogs(), 0, limit - 1, { REV: true });
        const logs = await Promise.all(
            ids.map(async id => {
                const data = await redisClient.get(DBKeys.auditLog(id));
                return data ? JSON.parse(data) as AuditLog : null;
            })
        );
        return logs.filter((log): log is AuditLog => log !== null);
    },
};

// Counter Operations
export const counterDB = {
    async increment(name: string, amount = 1) {
        return await redisClient.incrBy(DBKeys.counter(name), amount);
    },

    async decrement(name: string, amount = 1) {
        return await redisClient.decrBy(DBKeys.counter(name), amount);
    },

    async get(name: string) {
        const value = await redisClient.get(DBKeys.counter(name));
        return value ? parseInt(value) : 0;
    },

    async set(name: string, value: number) {
        await redisClient.set(DBKeys.counter(name), value.toString());
        return value;
    },
};

// Export all database operations
export const db = {
    init: initDB,
    users: userDB,
    profiles: profileDB,
    announcements: announcementDB,
    gallery: galleryDB,
    chat: chatDB,
    roles: roleDB,
    audit: auditDB,
    counters: counterDB,
};

export default db;
