
import { ref, uploadBytes, getDownloadURL, deleteObject, uploadString } from 'firebase/storage';
import { storage } from './firebase';

export interface StoredFile {
    id: string;
    name: string;
    type: string;
    size: number;
    url: string;
    user_id: string;
    bucket: string;
    created_at: string;
}

export const firebaseStorage = {
    // Upload file
    async upload(
        bucket: string,
        file: File | Blob,
        userId: string,
        fileName?: string
    ): Promise<{ data: StoredFile | null; error: Error | null }> {
        try {
            const fileId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const name = fileName || (file as File).name || fileId;
            const storageRef = ref(storage, `${bucket}/${userId}/${fileId}-${name}`);

            const snapshot = await uploadBytes(storageRef, file);
            const url = await getDownloadURL(snapshot.ref);

            const storedFile: StoredFile = {
                id: fileId,
                name: name,
                type: file.type,
                size: file.size,
                url: url,
                user_id: userId,
                bucket,
                created_at: new Date().toISOString(),
            };

            return { data: storedFile, error: null };
        } catch (error) {
            return { data: null, error: error as Error };
        }
    },

    // Upload from data URL
    async uploadFromDataURL(
        bucket: string,
        dataURL: string,
        fileName: string,
        userId: string
    ): Promise<{ data: StoredFile | null; error: Error | null }> {
        try {
            const fileId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const storageRef = ref(storage, `${bucket}/${userId}/${fileId}-${fileName}`);

            // Extract base64 data and mime type
            const matches = dataURL.match(/^data:([^;]+);base64,(.+)$/);
            if (!matches) {
                return { data: null, error: new Error('Invalid data URL') };
            }

            const [, mimeType, base64Data] = matches;

            const snapshot = await uploadString(storageRef, base64Data, 'base64', {
                contentType: mimeType
            });
            const url = await getDownloadURL(snapshot.ref);

            const storedFile: StoredFile = {
                id: fileId,
                name: fileName,
                type: mimeType,
                size: Math.ceil(base64Data.length * 0.75),
                url: url,
                user_id: userId,
                bucket,
                created_at: new Date().toISOString(),
            };

            return { data: storedFile, error: null };
        } catch (error) {
            return { data: null, error: error as Error };
        }
    },

    // Get public URL
    async getPublicURL(path: string): Promise<string> {
        const storageRef = ref(storage, path);
        return await getDownloadURL(storageRef);
    },

    // Delete file
    async deleteFile(path: string): Promise<void> {
        const storageRef = ref(storage, path);
        await deleteObject(storageRef);
    }
};

export default firebaseStorage;
