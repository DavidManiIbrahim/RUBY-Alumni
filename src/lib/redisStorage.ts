/**
 * File Storage using Base64 encoding in Redis
 * Alternative to Supabase Storage
 * 
 * Note: For production, consider using:
 * - AWS S3
 * - Cloudinary
 * - ImgBB
 * - Firebase Storage
 * 
 * This implementation stores files as base64 in Redis (suitable for small files)
 */

import { redisClient } from './redis';
import { generateId } from './redisDB';

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

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB limit for Redis storage

export const storage = {
    // Upload file
    async upload(
        bucket: string,
        file: File,
        userId: string
    ): Promise<{ data: StoredFile | null; error: Error | null }> {
        try {
            // Check file size
            if (file.size > MAX_FILE_SIZE) {
                return {
                    data: null,
                    error: new Error(`File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`)
                };
            }

            // Convert file to base64
            const base64 = await this.fileToBase64(file);

            const fileId = generateId();
            const storedFile: StoredFile = {
                id: fileId,
                name: file.name,
                type: file.type,
                size: file.size,
                data: base64,
                user_id: userId,
                bucket,
                created_at: new Date().toISOString(),
                url: `/api/files/${bucket}/${fileId}`, // Virtual URL
            };

            // Store in Redis
            await redisClient.set(
                `storage:${bucket}:${fileId}`,
                JSON.stringify(storedFile)
            );

            // Add to bucket index
            await redisClient.sAdd(`storage:bucket:${bucket}`, fileId);

            // Add to user's files
            await redisClient.sAdd(`storage:user:${userId}`, fileId);

            return { data: storedFile, error: null };
        } catch (error) {
            return { data: null, error: error as Error };
        }
    },

    // Upload from URL (for base64 data URLs)
    async uploadFromDataURL(
        bucket: string,
        dataURL: string,
        fileName: string,
        userId: string
    ): Promise<{ data: StoredFile | null; error: Error | null }> {
        try {
            // Extract base64 data and mime type
            const matches = dataURL.match(/^data:([^;]+);base64,(.+)$/);
            if (!matches) {
                return { data: null, error: new Error('Invalid data URL') };
            }

            const [, mimeType, base64Data] = matches;
            const size = Math.ceil(base64Data.length * 0.75); // Approximate size

            if (size > MAX_FILE_SIZE) {
                return {
                    data: null,
                    error: new Error(`File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`)
                };
            }

            const fileId = generateId();
            const storedFile: StoredFile = {
                id: fileId,
                name: fileName,
                type: mimeType,
                size,
                data: base64Data,
                user_id: userId,
                bucket,
                created_at: new Date().toISOString(),
                url: `/api/files/${bucket}/${fileId}`,
            };

            // Store in Redis
            await redisClient.set(
                `storage:${bucket}:${fileId}`,
                JSON.stringify(storedFile)
            );

            // Add to bucket index
            await redisClient.sAdd(`storage:bucket:${bucket}`, fileId);

            // Add to user's files
            await redisClient.sAdd(`storage:user:${userId}`, fileId);

            return { data: storedFile, error: null };
        } catch (error) {
            return { data: null, error: error as Error };
        }
    },

    // Get file
    async getFile(bucket: string, fileId: string): Promise<StoredFile | null> {
        const data = await redisClient.get(`storage:${bucket}:${fileId}`);
        if (!data) return null;
        return JSON.parse(data);
    },

    // Get file as data URL
    async getFileDataURL(bucket: string, fileId: string): Promise<string | null> {
        const file = await this.getFile(bucket, fileId);
        if (!file) return null;
        return `data:${file.type};base64,${file.data}`;
    },

    // Delete file
    async deleteFile(bucket: string, fileId: string, userId: string): Promise<boolean> {
        const file = await this.getFile(bucket, fileId);
        if (!file || file.user_id !== userId) {
            return false;
        }

        await redisClient.del(`storage:${bucket}:${fileId}`);
        await redisClient.sRem(`storage:bucket:${bucket}`, fileId);
        await redisClient.sRem(`storage:user:${userId}`, fileId);

        return true;
    },

    // List files in bucket
    async listFiles(bucket: string, limit = 100): Promise<StoredFile[]> {
        const fileIds = await redisClient.sMembers(`storage:bucket:${bucket}`);
        const files = await Promise.all(
            fileIds.slice(0, limit).map(id => this.getFile(bucket, id))
        );
        return files.filter(Boolean) as StoredFile[];
    },

    // List user's files
    async listUserFiles(userId: string, limit = 100): Promise<StoredFile[]> {
        const fileIds = await redisClient.sMembers(`storage:user:${userId}`);
        const filesData = await Promise.all(
            fileIds.slice(0, limit).map(async id => {
                // Try to find the file in common buckets
                const buckets = ['profile-pictures', 'gallery', 'avatars'];
                for (const bucket of buckets) {
                    const file = await this.getFile(bucket, id);
                    if (file) return file;
                }
                return null;
            })
        );
        return filesData.filter(Boolean) as StoredFile[];
    },

    // Helper: Convert File to base64
    fileToBase64(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const result = reader.result as string;
                // Remove data URL prefix
                const base64 = result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    },

    // Helper: Get public URL for file
    getPublicURL(bucket: string, fileId: string): string {
        return `/api/files/${bucket}/${fileId}`;
    },

    // Helper: Create data URL from file
    createDataURL(file: StoredFile): string {
        return `data:${file.type};base64,${file.data}`;
    },
};

export default storage;
