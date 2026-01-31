import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

// --- Profile Hooks ---

export const useProfile = (userId: string | null) => {
    const queryClient = useQueryClient();

    const { data: profile, isLoading: loading, error, refetch } = useQuery({
        queryKey: ['profile', userId],
        queryFn: async () => {
            if (!userId) return null;
            return await profileDB.getByUserId(userId);
        },
        enabled: !!userId,
    });

    const updateProfileMutation = useMutation({
        mutationFn: async (updates: ProfileUpdate) => {
            if (!userId) throw new Error('No user ID');
            return await profileDB.update(userId, updates);
        },
        onSuccess: (data) => {
            queryClient.setQueryData(['profile', userId], data);
            queryClient.invalidateQueries({ queryKey: ['profiles'] });
        },
    });

    return {
        profile: profile || null,
        loading,
        error: error as Error | null,
        refetch,
        updateProfile: updateProfileMutation.mutateAsync
    };
};

export const useProfiles = (filters?: ProfileFilters) => {
    const { data: profiles, isLoading: loading, error, refetch } = useQuery({
        queryKey: ['profiles', filters],
        queryFn: async () => {
            return await profileDB.getAll(filters);
        },
    });

    return {
        profiles: profiles || [],
        loading,
        error: error as Error | null,
        refetch
    };
};

// --- Announcement Hooks ---

export const useAnnouncements = (limit = 100) => {
    const queryClient = useQueryClient();

    const { data: announcements, isLoading: loading, error, refetch } = useQuery({
        queryKey: ['announcements', limit],
        queryFn: async () => {
            return await announcementDB.getAll(limit);
        },
    });

    const createMutation = useMutation({
        mutationFn: (data: AnnouncementCreate) => announcementDB.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['announcements'] });
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, updates }: { id: string; updates: AnnouncementUpdate }) =>
            announcementDB.update(id, updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['announcements'] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => announcementDB.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['announcements'] });
        },
    });

    return {
        announcements: announcements || [],
        loading,
        error: error as Error | null,
        refetch,
        createAnnouncement: createMutation.mutateAsync,
        updateAnnouncement: (id: string, updates: AnnouncementUpdate) =>
            updateMutation.mutateAsync({ id, updates }),
        deleteAnnouncement: deleteMutation.mutateAsync,
    };
};

// --- Gallery Hooks ---

export const useGallery = (userId?: string, limit = 100) => {
    const queryClient = useQueryClient();

    const { data: gallery, isLoading: loading, error, refetch } = useQuery({
        queryKey: ['gallery', userId, limit],
        queryFn: async () => {
            return userId
                ? await galleryDB.getByUserId(userId)
                : await galleryDB.getAll(limit);
        },
    });

    const createGalleryItemMutation = useMutation({
        mutationFn: (data: GalleryItemCreate) => galleryDB.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['gallery'] });
        },
    });

    const updateGalleryItemMutation = useMutation({
        mutationFn: ({ id, updates }: { id: string; updates: GalleryItemUpdate }) =>
            galleryDB.update(id, updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['gallery'] });
        },
    });

    const deleteGalleryItemMutation = useMutation({
        mutationFn: (id: string) => galleryDB.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['gallery'] });
        },
    });

    return {
        gallery: gallery || [],
        loading,
        error: error as Error | null,
        refetch,
        createGalleryItem: createGalleryItemMutation.mutateAsync,
        updateGalleryItem: (id: string, updates: GalleryItemUpdate) =>
            updateGalleryItemMutation.mutateAsync({ id, updates }),
        deleteGalleryItem: deleteGalleryItemMutation.mutateAsync,
    };
};

// --- Chat Hooks ---

export const useChatMessages = (roomId = 'general', limit = 100) => {
    const queryClient = useQueryClient();

    const { data: messages, isLoading: loading, error, refetch } = useQuery({
        queryKey: ['chat', roomId, limit],
        queryFn: async () => {
            const data = await chatDB.getAll(roomId, limit);
            return data.reverse();
        },
    });

    const sendMutation = useMutation({
        mutationFn: (data: ChatMessageCreate) => chatDB.create({
            ...data,
            room_id: data.room_id || roomId
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['chat', roomId] });
        },
    });

    return {
        messages: messages || [],
        loading,
        error: error as Error | null,
        refetch,
        sendMessage: sendMutation.mutateAsync,
    };
};
