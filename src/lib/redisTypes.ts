/**
 * TypeScript types for Redis database
 */

export interface User {
    id: string;
    email: string;
    password_hash: string;
    full_name: string;
    email_verified: boolean;
    created_at: string;
    updated_at: string;
}

export interface Profile {
    id: string;
    user_id: string;
    full_name: string | null;
    graduation_year: number | null;
    profile_picture_url: string | null;
    gender: string | null;
    phone_number: string | null;
    current_location: string | null;
    bio: string | null;
    email_address: string | null;
    position_held: string | null;
    university: string | null;
    course_studied: string | null;
    approval_status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    updated_at: string;
}

export interface Announcement {
    id: string;
    title: string;
    content: string;
    user_id: string;
    created_at: string;
    updated_at: string;
}

export interface GalleryItem {
    id: string;
    url: string;
    caption: string | null;
    user_id: string;
    media_type?: 'image' | 'video';
    created_at: string;
    updated_at: string;
}

export interface ChatMessage {
    id: string;
    content: string;
    user_id: string;
    created_at: string;
}

export interface AuditLog {
    id: string;
    action: string;
    user_id: string;
    metadata?: Record<string, unknown>;
    created_at: string;
}

export interface Session {
    id: string;
    user_id: string;
    expires_at: string;
    created_at: string;
}

export interface StoredFile {
    id: string;
    name: string;
    type: string;
    size: number;
    data: string; // base64 encoded
    user_id: string;
    bucket: string;
    created_at: string;
    url: string;
}

// Partial types for updates
export type UserUpdate = Partial<Omit<User, 'id' | 'created_at'>>;
export type ProfileUpdate = Partial<Omit<Profile, 'id' | 'user_id' | 'created_at'>>;
export type AnnouncementUpdate = Partial<Omit<Announcement, 'id' | 'created_at'>>;
export type GalleryItemUpdate = Partial<Omit<GalleryItem, 'id' | 'created_at'>>;

// Create types (without id and timestamps)
export type UserCreate = Omit<User, 'id' | 'created_at' | 'updated_at'>;
export type ProfileCreate = Omit<Profile, 'id' | 'created_at' | 'updated_at'>;
export type AnnouncementCreate = Omit<Announcement, 'id' | 'created_at' | 'updated_at'>;
export type GalleryItemCreate = Omit<GalleryItem, 'id' | 'created_at' | 'updated_at'>;
export type ChatMessageCreate = Omit<ChatMessage, 'id' | 'created_at'>;
export type AuditLogCreate = Omit<AuditLog, 'id' | 'created_at'>;

// Filter types
export interface ProfileFilters {
    approval_status?: 'pending' | 'approved' | 'rejected';
    graduation_year?: number;
}
