import { useState, useEffect, useCallback } from 'react';
import { profileDB, announcementDB, galleryDB, chatDB, roleDB } from '@/lib/redisDB';
import type {
    Profile,
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
} from '@/lib/redisTypes';

/**
 * React hooks for Redis database operations
 */

// Hook for user profile
export const useProfile = (userId: string | null) => {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchProfile = useCallback(async () => {
        if (!userId) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const data = await profileDB.getByUserId(userId);
            setProfile(data);
            setError(null);
        } catch (err) {
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    const updateProfile = useCallback(async (updates: ProfileUpdate) => {
        if (!userId) return { error: new Error('No user ID') };

        try {
            const updated = await profileDB.update(userId, updates);
            setProfile(updated);
            return { data: updated, error: null };
        } catch (err) {
            return { data: null, error: err as Error };
        }
    }, [userId]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    return { profile, loading, error, refetch: fetchProfile, updateProfile };
};

// Hook for all profiles
export const useProfiles = (filters?: ProfileFilters) => {
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchProfiles = useCallback(async () => {
        try {
            setLoading(true);
            const data = await profileDB.getAll(filters);
            setProfiles(data);
            setError(null);
        } catch (err) {
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    }, [filters?.approval_status, filters?.graduation_year]);

    useEffect(() => {
        fetchProfiles();
    }, [fetchProfiles]);

    return { profiles, loading, error, refetch: fetchProfiles };
};

// Hook for announcements
export const useAnnouncements = (limit = 100) => {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchAnnouncements = useCallback(async () => {
        try {
            setLoading(true);
            const data = await announcementDB.getAll(limit);
            setAnnouncements(data);
            setError(null);
        } catch (err) {
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    }, [limit]);

    const createAnnouncement = useCallback(async (announcementData: AnnouncementCreate) => {
        try {
            const created = await announcementDB.create(announcementData);
            await fetchAnnouncements(); // Refresh list
            return { data: created, error: null };
        } catch (err) {
            return { data: null, error: err as Error };
        }
    }, [fetchAnnouncements]);

    const updateAnnouncement = useCallback(async (id: string, updates: AnnouncementUpdate) => {
        try {
            const updated = await announcementDB.update(id, updates);
            await fetchAnnouncements(); // Refresh list
            return { data: updated, error: null };
        } catch (err) {
            return { data: null, error: err as Error };
        }
    }, [fetchAnnouncements]);

    const deleteAnnouncement = useCallback(async (id: string) => {
        try {
            await announcementDB.delete(id);
            await fetchAnnouncements(); // Refresh list
            return { error: null };
        } catch (err) {
            return { error: err as Error };
        }
    }, [fetchAnnouncements]);

    useEffect(() => {
        fetchAnnouncements();
    }, [fetchAnnouncements]);

    return {
        announcements,
        loading,
        error,
        refetch: fetchAnnouncements,
        createAnnouncement,
        updateAnnouncement,
        deleteAnnouncement,
    };
};

// Hook for gallery
export const useGallery = (userId?: string, limit = 100) => {
    const [gallery, setGallery] = useState<GalleryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchGallery = useCallback(async () => {
        try {
            setLoading(true);
            const data = userId
                ? await galleryDB.getByUserId(userId)
                : await galleryDB.getAll(limit);
            setGallery(data);
            setError(null);
        } catch (err) {
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    }, [userId, limit]);

    const createGalleryItem = useCallback(async (itemData: GalleryItemCreate) => {
        try {
            const created = await galleryDB.create(itemData);
            await fetchGallery(); // Refresh list
            return { data: created, error: null };
        } catch (err) {
            return { data: null, error: err as Error };
        }
    }, [fetchGallery]);

    const updateGalleryItem = useCallback(async (id: string, updates: GalleryItemUpdate) => {
        try {
            const updated = await galleryDB.update(id, updates);
            await fetchGallery(); // Refresh list
            return { data: updated, error: null };
        } catch (err) {
            return { data: null, error: err as Error };
        }
    }, [fetchGallery]);

    const deleteGalleryItem = useCallback(async (id: string) => {
        try {
            await galleryDB.delete(id);
            await fetchGallery(); // Refresh list
            return { error: null };
        } catch (err) {
            return { error: err as Error };
        }
    }, [fetchGallery]);

    useEffect(() => {
        fetchGallery();
    }, [fetchGallery]);

    return {
        gallery,
        loading,
        error,
        refetch: fetchGallery,
        createGalleryItem,
        updateGalleryItem,
        deleteGalleryItem,
    };
};

// Hook for chat messages
export const useChatMessages = (limit = 100) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchMessages = useCallback(async () => {
        try {
            setLoading(true);
            const data = await chatDB.getAll(limit);
            setMessages(data);
            setError(null);
        } catch (err) {
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    }, [limit]);

    const sendMessage = useCallback(async (messageData: ChatMessageCreate) => {
        try {
            const created = await chatDB.create(messageData);
            await fetchMessages(); // Refresh list
            return { data: created, error: null };
        } catch (err) {
            return { data: null, error: err as Error };
        }
    }, [fetchMessages]);

    const deleteMessage = useCallback(async (id: string) => {
        try {
            await chatDB.delete(id);
            await fetchMessages(); // Refresh list
            return { error: null };
        } catch (err) {
            return { error: err as Error };
        }
    }, [fetchMessages]);

    useEffect(() => {
        fetchMessages();
    }, [fetchMessages]);

    return {
        messages,
        loading,
        error,
        refetch: fetchMessages,
        sendMessage,
        deleteMessage,
    };
};

// Hook for user role
export const useUserRole = (userId: string | null) => {
    const [role, setRole] = useState<string | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchRole = useCallback(async () => {
        if (!userId) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const userRole = await roleDB.getRole(userId);
            const adminStatus = await roleDB.isAdmin(userId);
            setRole(userRole);
            setIsAdmin(adminStatus);
            setError(null);
        } catch (err) {
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchRole();
    }, [fetchRole]);

    return { role, isAdmin, loading, error, refetch: fetchRole };
};

// Hook for profile search
export const useProfileSearch = (query: string) => {
    const [results, setResults] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const search = useCallback(async () => {
        if (!query || query.length < 2) {
            setResults([]);
            return;
        }

        try {
            setLoading(true);
            const data = await profileDB.search(query);
            setResults(data);
            setError(null);
        } catch (err) {
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    }, [query]);

    useEffect(() => {
        const debounce = setTimeout(search, 300);
        return () => clearTimeout(debounce);
    }, [search]);

    return { results, loading, error };
};

// Hook for real-time updates (polling-based)
export const useRealtimeUpdates = <T,>(
    fetchFunction: () => Promise<T[]>,
    interval = 5000
) => {
    const [data, setData] = useState<T[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const fetch = async () => {
            try {
                const result = await fetchFunction();
                setData(result);
                setError(null);
                setLoading(false);
            } catch (err) {
                setError(err as Error);
                setLoading(false);
            }
        };

        fetch(); // Initial fetch
        const intervalId = setInterval(fetch, interval);

        return () => clearInterval(intervalId);
    }, [fetchFunction, interval]);

    return { data, loading, error };
};
