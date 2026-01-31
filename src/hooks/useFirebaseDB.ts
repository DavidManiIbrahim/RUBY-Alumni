
import { useState, useEffect, useCallback } from 'react';
import { profileDB, announcementDB, galleryDB, chatDB } from '@/lib/firebaseDB';
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
            await fetchAnnouncements();
            return { data: created, error: null };
        } catch (err) {
            return { data: null, error: err as Error };
        }
    }, [fetchAnnouncements]);

    const updateAnnouncement = useCallback(async (id: string, updates: AnnouncementUpdate) => {
        try {
            const updated = await announcementDB.update(id, updates);
            await fetchAnnouncements();
            return { data: updated, error: null };
        } catch (err) {
            return { data: null, error: err as Error };
        }
    }, [fetchAnnouncements]);

    const deleteAnnouncement = useCallback(async (id: string) => {
        try {
            await announcementDB.delete(id);
            await fetchAnnouncements();
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
            await fetchGallery();
            return { data: created, error: null };
        } catch (err) {
            return { data: null, error: err as Error };
        }
    }, [fetchGallery]);

    const updateGalleryItem = useCallback(async (id: string, updates: GalleryItemUpdate) => {
        try {
            const updated = await galleryDB.update(id, updates);
            await fetchGallery();
            return { data: updated, error: null };
        } catch (err) {
            return { data: null, error: err as Error };
        }
    }, [fetchGallery]);

    const deleteGalleryItem = useCallback(async (id: string) => {
        try {
            await galleryDB.delete(id);
            await fetchGallery();
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

export const useChatMessages = (roomId = 'general', limit = 100) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchMessages = useCallback(async () => {
        try {
            setLoading(true);
            const data = await chatDB.getAll(roomId, limit);
            setMessages(data.reverse()); // Show in chronological order for chat UI
            setError(null);
        } catch (err) {
            console.error(`[useChatMessages] Error fetching messages for ${roomId}:`, err);
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    }, [roomId, limit]);

    const sendMessage = useCallback(async (messageData: ChatMessageCreate) => {
        try {
            const created = await chatDB.create({
                ...messageData,
                room_id: messageData.room_id || roomId
            });
            await fetchMessages();
            return { data: created, error: null };
        } catch (err) {
            console.error(`[useChatMessages] Error sending message to ${roomId}:`, err);
            return { data: null, error: err as Error };
        }
    }, [fetchMessages, roomId]);

    useEffect(() => {
        fetchMessages();
    }, [fetchMessages]);

    return {
        messages,
        loading,
        error,
        refetch: fetchMessages,
        sendMessage,
    };
};
