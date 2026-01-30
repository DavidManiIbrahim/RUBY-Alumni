import { useEffect, useState, useCallback } from 'react';
import { initRedis, cache, rateLimit } from '@/lib/redis';
import {
    cachedProfile,
    cachedProfiles,
    cachedAnnouncements,
    cachedGallery,
    cachedUserRole,
    cachedChatMessages,
    cachedAuditLogs,
    warmUpCache,
} from '@/lib/cachedSupabase';

/**
 * Hook to initialize Redis connection
 */
export const useRedis = () => {
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const connect = async () => {
            try {
                await initRedis();
                setIsConnected(true);
            } catch (err) {
                setError(err as Error);
                console.error('Redis connection error:', err);
            }
        };

        connect();
    }, []);

    return { isConnected, error };
};

/**
 * Hook for cached profile data
 */
export const useCachedProfile = (userId: string | null) => {
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [fromCache, setFromCache] = useState(false);

    const fetchProfile = useCallback(async () => {
        if (!userId) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const { data, error: fetchError, fromCache: cached } = await cachedProfile.get(userId);

            if (fetchError) throw fetchError;

            setProfile(data);
            setFromCache(cached);
            setError(null);
        } catch (err) {
            setError(err as Error);
            console.error('Error fetching cached profile:', err);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    const updateProfile = useCallback(async (updates: any) => {
        if (!userId) return;

        try {
            const { data, error: updateError } = await cachedProfile.update(userId, updates);

            if (updateError) throw updateError;

            setProfile(data);
            return { data, error: null };
        } catch (err) {
            setError(err as Error);
            return { data: null, error: err as Error };
        }
    }, [userId]);

    const invalidate = useCallback(async () => {
        if (!userId) return;
        await cachedProfile.invalidate(userId);
    }, [userId]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    return { profile, loading, error, fromCache, refetch: fetchProfile, updateProfile, invalidate };
};

/**
 * Hook for cached profiles list
 */
export const useCachedProfiles = (filters?: { approvalStatus?: string }) => {
    const [profiles, setProfiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [fromCache, setFromCache] = useState(false);

    const fetchProfiles = useCallback(async () => {
        try {
            setLoading(true);
            const { data, error: fetchError, fromCache: cached } = await cachedProfiles.getAll(filters);

            if (fetchError) throw fetchError;

            setProfiles(data || []);
            setFromCache(cached);
            setError(null);
        } catch (err) {
            setError(err as Error);
            console.error('Error fetching cached profiles:', err);
        } finally {
            setLoading(false);
        }
    }, [filters?.approvalStatus]);

    const invalidate = useCallback(async () => {
        await cachedProfiles.invalidate();
    }, []);

    useEffect(() => {
        fetchProfiles();
    }, [fetchProfiles]);

    return { profiles, loading, error, fromCache, refetch: fetchProfiles, invalidate };
};

/**
 * Hook for cached announcements
 */
export const useCachedAnnouncements = () => {
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [fromCache, setFromCache] = useState(false);

    const fetchAnnouncements = useCallback(async () => {
        try {
            setLoading(true);
            const { data, error: fetchError, fromCache: cached } = await cachedAnnouncements.getAll();

            if (fetchError) throw fetchError;

            setAnnouncements(data || []);
            setFromCache(cached);
            setError(null);
        } catch (err) {
            setError(err as Error);
            console.error('Error fetching cached announcements:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    const createAnnouncement = useCallback(async (announcement: any) => {
        try {
            const { data, error: createError } = await cachedAnnouncements.create(announcement);

            if (createError) throw createError;

            await fetchAnnouncements(); // Refresh list
            return { data, error: null };
        } catch (err) {
            return { data: null, error: err as Error };
        }
    }, [fetchAnnouncements]);

    const updateAnnouncement = useCallback(async (id: string, updates: any) => {
        try {
            const { data, error: updateError } = await cachedAnnouncements.update(id, updates);

            if (updateError) throw updateError;

            await fetchAnnouncements(); // Refresh list
            return { data, error: null };
        } catch (err) {
            return { data: null, error: err as Error };
        }
    }, [fetchAnnouncements]);

    const deleteAnnouncement = useCallback(async (id: string) => {
        try {
            const { error: deleteError } = await cachedAnnouncements.delete(id);

            if (deleteError) throw deleteError;

            await fetchAnnouncements(); // Refresh list
            return { error: null };
        } catch (err) {
            return { error: err as Error };
        }
    }, [fetchAnnouncements]);

    const invalidate = useCallback(async () => {
        await cachedAnnouncements.invalidate();
    }, []);

    useEffect(() => {
        fetchAnnouncements();
    }, [fetchAnnouncements]);

    return {
        announcements,
        loading,
        error,
        fromCache,
        refetch: fetchAnnouncements,
        createAnnouncement,
        updateAnnouncement,
        deleteAnnouncement,
        invalidate
    };
};

/**
 * Hook for cached gallery
 */
export const useCachedGallery = () => {
    const [gallery, setGallery] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [fromCache, setFromCache] = useState(false);

    const fetchGallery = useCallback(async () => {
        try {
            setLoading(true);
            const { data, error: fetchError, fromCache: cached } = await cachedGallery.getAll();

            if (fetchError) throw fetchError;

            setGallery(data || []);
            setFromCache(cached);
            setError(null);
        } catch (err) {
            setError(err as Error);
            console.error('Error fetching cached gallery:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    const createGalleryItem = useCallback(async (item: any) => {
        try {
            const { data, error: createError } = await cachedGallery.create(item);

            if (createError) throw createError;

            await fetchGallery(); // Refresh list
            return { data, error: null };
        } catch (err) {
            return { data: null, error: err as Error };
        }
    }, [fetchGallery]);

    const deleteGalleryItem = useCallback(async (id: string) => {
        try {
            const { error: deleteError } = await cachedGallery.delete(id);

            if (deleteError) throw deleteError;

            await fetchGallery(); // Refresh list
            return { error: null };
        } catch (err) {
            return { error: err as Error };
        }
    }, [fetchGallery]);

    const invalidate = useCallback(async () => {
        await cachedGallery.invalidate();
    }, []);

    useEffect(() => {
        fetchGallery();
    }, [fetchGallery]);

    return {
        gallery,
        loading,
        error,
        fromCache,
        refetch: fetchGallery,
        createGalleryItem,
        deleteGalleryItem,
        invalidate
    };
};

/**
 * Hook for rate limiting
 */
export const useRateLimit = (userId: string | null, action: string, limit: number, windowSeconds: number) => {
    const [isAllowed, setIsAllowed] = useState(true);
    const [remaining, setRemaining] = useState(limit);
    const [resetAt, setResetAt] = useState<number>(Date.now());

    const checkLimit = useCallback(async () => {
        if (!userId) return true;

        try {
            const result = await rateLimit.check(userId, action, limit, windowSeconds);
            setIsAllowed(result.allowed);
            setRemaining(result.remaining);
            setResetAt(result.resetAt);
            return result.allowed;
        } catch (err) {
            console.error('Rate limit check error:', err);
            return true; // Allow on error
        }
    }, [userId, action, limit, windowSeconds]);

    return { isAllowed, remaining, resetAt, checkLimit };
};

/**
 * Hook for cache warming
 */
export const useCacheWarming = (userId?: string) => {
    const [isWarming, setIsWarming] = useState(false);

    useEffect(() => {
        const warmCache = async () => {
            setIsWarming(true);
            try {
                await warmUpCache(userId);
            } catch (err) {
                console.error('Cache warming error:', err);
            } finally {
                setIsWarming(false);
            }
        };

        warmCache();
    }, [userId]);

    return { isWarming };
};

/**
 * Hook for cached user role
 */
export const useCachedUserRole = (userId: string | null) => {
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [fromCache, setFromCache] = useState(false);

    const fetchRole = useCallback(async () => {
        if (!userId) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const { data, error: fetchError, fromCache: cached } = await cachedUserRole.get(userId);

            if (fetchError) throw fetchError;

            setIsAdmin(data);
            setFromCache(cached);
            setError(null);
        } catch (err) {
            setError(err as Error);
            console.error('Error fetching cached user role:', err);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    const invalidate = useCallback(async () => {
        if (!userId) return;
        await cachedUserRole.invalidate(userId);
    }, [userId]);

    useEffect(() => {
        fetchRole();
    }, [fetchRole]);

    return { isAdmin, loading, error, fromCache, refetch: fetchRole, invalidate };
};
