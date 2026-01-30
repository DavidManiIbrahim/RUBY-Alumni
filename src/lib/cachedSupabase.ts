import { supabase } from '@/integrations/supabase/client';
import cache, { CacheKeys, CacheTTL } from './redis';

/**
 * Cached Supabase operations with Redis
 * This module provides optimized database queries with automatic caching
 */

// Profile operations
export const cachedProfile = {
    async get(userId: string) {
        const cacheKey = CacheKeys.profile(userId);

        // Try cache first
        const cached = await cache.get(cacheKey);
        if (cached) {
            console.log(`Cache HIT: Profile for ${userId}`);
            return { data: cached, error: null, fromCache: true };
        }

        // Cache miss - fetch from database
        console.log(`Cache MISS: Profile for ${userId}`);
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

        if (!error && data) {
            // Store in cache
            await cache.set(cacheKey, data, CacheTTL.profile);
        }

        return { data, error, fromCache: false };
    },

    async update(userId: string, updates: any) {
        // Update database
        const { data, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('user_id', userId)
            .select()
            .single();

        if (!error && data) {
            // Update cache
            await cache.set(CacheKeys.profile(userId), data, CacheTTL.profile);
            // Invalidate profiles list cache
            await cache.del(CacheKeys.profiles());
        }

        return { data, error };
    },

    async invalidate(userId: string) {
        await cache.del(CacheKeys.profile(userId));
        await cache.del(CacheKeys.profiles());
    },
};

// Profiles list operations
export const cachedProfiles = {
    async getAll(filters?: { approvalStatus?: string }) {
        const cacheKey = filters?.approvalStatus
            ? `${CacheKeys.profiles()}:${filters.approvalStatus}`
            : CacheKeys.profiles();

        // Try cache first
        const cached = await cache.get(cacheKey);
        if (cached) {
            console.log('Cache HIT: All profiles');
            return { data: cached, error: null, fromCache: true };
        }

        // Cache miss - fetch from database
        console.log('Cache MISS: All profiles');
        let query = supabase.from('profiles').select('*');

        if (filters?.approvalStatus) {
            query = query.eq('approval_status', filters.approvalStatus);
        }

        const { data, error } = await query;

        if (!error && data) {
            // Store in cache
            await cache.set(cacheKey, data, CacheTTL.profiles);
        }

        return { data, error, fromCache: false };
    },

    async invalidate() {
        await cache.delPattern('profiles:*');
    },
};

// Announcements operations
export const cachedAnnouncements = {
    async getAll() {
        const cacheKey = CacheKeys.announcements();

        // Try cache first
        const cached = await cache.get(cacheKey);
        if (cached) {
            console.log('Cache HIT: Announcements');
            return { data: cached, error: null, fromCache: true };
        }

        // Cache miss - fetch from database
        console.log('Cache MISS: Announcements');
        const { data, error } = await supabase
            .from('announcements')
            .select('*')
            .order('created_at', { ascending: false });

        if (!error && data) {
            // Store in cache
            await cache.set(cacheKey, data, CacheTTL.announcements);
        }

        return { data, error, fromCache: false };
    },

    async create(announcement: any) {
        // Create in database
        const { data, error } = await supabase
            .from('announcements')
            .insert(announcement)
            .select()
            .single();

        if (!error) {
            // Invalidate cache
            await cache.del(CacheKeys.announcements());
        }

        return { data, error };
    },

    async update(id: string, updates: any) {
        // Update database
        const { data, error } = await supabase
            .from('announcements')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (!error) {
            // Invalidate cache
            await cache.del(CacheKeys.announcements());
        }

        return { data, error };
    },

    async delete(id: string) {
        // Delete from database
        const { error } = await supabase
            .from('announcements')
            .delete()
            .eq('id', id);

        if (!error) {
            // Invalidate cache
            await cache.del(CacheKeys.announcements());
        }

        return { error };
    },

    async invalidate() {
        await cache.del(CacheKeys.announcements());
    },
};

// Gallery operations
export const cachedGallery = {
    async getAll() {
        const cacheKey = CacheKeys.gallery();

        // Try cache first
        const cached = await cache.get(cacheKey);
        if (cached) {
            console.log('Cache HIT: Gallery');
            return { data: cached, error: null, fromCache: true };
        }

        // Cache miss - fetch from database
        console.log('Cache MISS: Gallery');
        const { data, error } = await supabase
            .from('gallery')
            .select('*')
            .order('created_at', { ascending: false });

        if (!error && data) {
            // Store in cache
            await cache.set(cacheKey, data, CacheTTL.gallery);
        }

        return { data, error, fromCache: false };
    },

    async create(item: any) {
        // Create in database
        const { data, error } = await supabase
            .from('gallery')
            .insert(item)
            .select()
            .single();

        if (!error) {
            // Invalidate cache
            await cache.del(CacheKeys.gallery());
        }

        return { data, error };
    },

    async delete(id: string) {
        // Delete from database
        const { error } = await supabase
            .from('gallery')
            .delete()
            .eq('id', id);

        if (!error) {
            // Invalidate cache
            await cache.del(CacheKeys.gallery());
        }

        return { error };
    },

    async invalidate() {
        await cache.del(CacheKeys.gallery());
    },
};

// User role operations
export const cachedUserRole = {
    async get(userId: string) {
        const cacheKey = CacheKeys.userRole(userId);

        // Try cache first
        const cached = await cache.get(cacheKey);
        if (cached !== null) {
            console.log(`Cache HIT: User role for ${userId}`);
            return { data: cached, error: null, fromCache: true };
        }

        // Cache miss - fetch from database
        console.log(`Cache MISS: User role for ${userId}`);
        const { data, error } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', userId)
            .eq('role', 'admin')
            .maybeSingle();

        const isAdmin = !!data;

        if (!error) {
            // Store in cache
            await cache.set(cacheKey, isAdmin, CacheTTL.userRole);
        }

        return { data: isAdmin, error, fromCache: false };
    },

    async invalidate(userId: string) {
        await cache.del(CacheKeys.userRole(userId));
    },
};

// Chat messages operations
export const cachedChatMessages = {
    async getAll() {
        const cacheKey = CacheKeys.chatMessages();

        // Try cache first
        const cached = await cache.get(cacheKey);
        if (cached) {
            console.log('Cache HIT: Chat messages');
            return { data: cached, error: null, fromCache: true };
        }

        // Cache miss - fetch from database
        console.log('Cache MISS: Chat messages');
        const { data, error } = await supabase
            .from('chat_messages')
            .select('*')
            .order('created_at', { ascending: true });

        if (!error && data) {
            // Store in cache with shorter TTL
            await cache.set(cacheKey, data, CacheTTL.chatMessages);
        }

        return { data, error, fromCache: false };
    },

    async create(message: any) {
        // Create in database
        const { data, error } = await supabase
            .from('chat_messages')
            .insert(message)
            .select()
            .single();

        if (!error) {
            // Invalidate cache
            await cache.del(CacheKeys.chatMessages());
        }

        return { data, error };
    },

    async invalidate() {
        await cache.del(CacheKeys.chatMessages());
    },
};

// Audit logs operations
export const cachedAuditLogs = {
    async getAll() {
        const cacheKey = CacheKeys.auditLogs();

        // Try cache first
        const cached = await cache.get(cacheKey);
        if (cached) {
            console.log('Cache HIT: Audit logs');
            return { data: cached, error: null, fromCache: true };
        }

        // Cache miss - fetch from database
        console.log('Cache MISS: Audit logs');
        const { data, error } = await supabase
            .from('audit_logs' as any)
            .select('*')
            .order('created_at', { ascending: false });

        if (!error && data) {
            // Store in cache
            await cache.set(cacheKey, data, CacheTTL.auditLogs);
        }

        return { data, error, fromCache: false };
    },

    async create(log: any) {
        // Create in database
        const { data, error } = await supabase
            .from('audit_logs' as any)
            .insert(log);

        if (!error) {
            // Invalidate cache
            await cache.del(CacheKeys.auditLogs());
        }

        return { data, error };
    },

    async invalidate() {
        await cache.del(CacheKeys.auditLogs());
    },
};

// Utility function to warm up cache
export const warmUpCache = async (userId?: string) => {
    console.log('Warming up cache...');

    try {
        // Pre-load common data
        await Promise.all([
            cachedAnnouncements.getAll(),
            cachedGallery.getAll(),
            userId ? cachedProfile.get(userId) : Promise.resolve(),
            userId ? cachedUserRole.get(userId) : Promise.resolve(),
        ]);

        console.log('Cache warmed up successfully');
    } catch (error) {
        console.error('Error warming up cache:', error);
    }
};

// Clear all application cache
export const clearAllCache = async () => {
    await cache.flush();
    console.log('All cache cleared');
};
