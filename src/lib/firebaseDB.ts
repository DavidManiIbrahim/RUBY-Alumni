
import {
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    addDoc,
    serverTimestamp,
    Timestamp,
    QueryConstraint
} from 'firebase/firestore';
import { db } from './firebase';
import type {
    User,
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
    AuditLog,
    AuditLogCreate,
} from './redisTypes';

// Use same types from redisTypes for consistency during migration
// In a real project, we'd rename redisTypes.ts to types.ts

export const userDB = {
    async create(userId: string, data: any): Promise<void> {
        await setDoc(doc(db, 'users', userId), {
            ...data,
            created_at: serverTimestamp(),
            updated_at: serverTimestamp(),
        });
    },

    async getById(userId: string): Promise<User | null> {
        const snap = await getDoc(doc(db, 'users', userId));
        if (!snap.exists()) return null;
        const data = snap.data();
        return {
            id: snap.id,
            ...data,
            created_at: data.created_at?.toDate?.()?.toISOString() || data.created_at,
            updated_at: data.updated_at?.toDate?.()?.toISOString() || data.updated_at,
        } as User;
    },

    async getByEmail(email: string): Promise<User | null> {
        const q = query(collection(db, 'users'), where('email', '==', email), limit(1));
        const snap = await getDocs(q);
        if (snap.empty) return null;
        const docSnap = snap.docs[0];
        const data = docSnap.data();
        return {
            id: docSnap.id,
            ...data,
            created_at: data.created_at?.toDate?.()?.toISOString() || data.created_at,
            updated_at: data.updated_at?.toDate?.()?.toISOString() || data.updated_at,
        } as User;
    },
};

export const profileDB = {
    async create(profileData: any): Promise<Profile> {
        const docRef = doc(db, 'profiles', profileData.user_id);
        const data = {
            ...profileData,
            created_at: serverTimestamp(),
            updated_at: serverTimestamp(),
        };
        await setDoc(docRef, data);
        return { id: profileData.user_id, ...data } as unknown as Profile;
    },

    async getByUserId(userId: string): Promise<Profile | null> {
        const snap = await getDoc(doc(db, 'profiles', userId));
        if (!snap.exists()) return null;
        const data = snap.data();
        return {
            id: snap.id,
            ...data,
            created_at: data.created_at?.toDate?.()?.toISOString() || data.created_at,
            updated_at: data.updated_at?.toDate?.()?.toISOString() || data.updated_at,
        } as unknown as Profile;
    },

    async update(userId: string, updates: ProfileUpdate): Promise<Profile | null> {
        const docRef = doc(db, 'profiles', userId);
        const data = {
            ...updates,
            updated_at: serverTimestamp(),
        };
        await updateDoc(docRef, data);
        return await this.getByUserId(userId);
    },

    async getAll(filters?: ProfileFilters): Promise<Profile[]> {
        let q = query(collection(db, 'profiles'));

        const constraints: QueryConstraint[] = [];
        if (filters?.approval_status) {
            constraints.push(where('approval_status', '==', filters.approval_status));
        }
        if (filters?.graduation_year) {
            constraints.push(where('graduation_year', '==', filters.graduation_year));
        }

        if (constraints.length > 0) {
            q = query(collection(db, 'profiles'), ...constraints);
        }

        const snap = await getDocs(q);
        return snap.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                created_at: data.created_at?.toDate?.()?.toISOString() || data.created_at,
                updated_at: data.updated_at?.toDate?.()?.toISOString() || data.updated_at,
            } as unknown as Profile;
        });
    },

    async search(searchTerm: string): Promise<Profile[]> {
        // Firestore doesn't support built-in full-text search. 
        // For now, we'll fetch all and filter in memory, or just a basic prefix match if possible.
        // Fetching all for now as it matches the previous Redis behavior.
        const all = await this.getAll();
        return all.filter(p => p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()));
    }
};

export const announcementDB = {
    async create(data: AnnouncementCreate): Promise<Announcement> {
        const docRef = await addDoc(collection(db, 'announcements'), {
            ...data,
            created_at: serverTimestamp(),
            updated_at: serverTimestamp(),
        });
        const snap = await getDoc(docRef);
        const result = snap.data()!;
        return {
            id: snap.id,
            ...result,
            created_at: result.created_at?.toDate?.()?.toISOString() || result.created_at,
            updated_at: result.updated_at?.toDate?.()?.toISOString() || result.updated_at,
        } as unknown as Announcement;
    },

    async getAll(maxItems = 100): Promise<Announcement[]> {
        const q = query(collection(db, 'announcements'), orderBy('created_at', 'desc'), limit(maxItems));
        const snap = await getDocs(q);
        return snap.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                created_at: data.created_at?.toDate?.()?.toISOString() || data.created_at,
                updated_at: data.updated_at?.toDate?.()?.toISOString() || data.updated_at,
            } as unknown as Announcement;
        });
    },

    async update(id: string, updates: AnnouncementUpdate): Promise<Announcement | null> {
        const docRef = doc(db, 'announcements', id);
        await updateDoc(docRef, {
            ...updates,
            updated_at: serverTimestamp(),
        });
        const snap = await getDoc(docRef);
        const data = snap.data();
        if (!data) return null;
        return {
            id: snap.id,
            ...data,
            created_at: data.created_at?.toDate?.()?.toISOString() || data.created_at,
            updated_at: data.updated_at?.toDate?.()?.toISOString() || data.updated_at,
        } as unknown as Announcement;
    },

    async delete(id: string): Promise<void> {
        await deleteDoc(doc(db, 'announcements', id));
    }
};

export const galleryDB = {
    async create(data: GalleryItemCreate): Promise<GalleryItem> {
        const docRef = await addDoc(collection(db, 'gallery'), {
            ...data,
            created_at: serverTimestamp(),
            updated_at: serverTimestamp(),
        });
        const snap = await getDoc(docRef);
        const result = snap.data()!;
        return {
            id: snap.id,
            ...result,
            created_at: result.created_at?.toDate?.()?.toISOString() || result.created_at,
            updated_at: result.updated_at?.toDate?.()?.toISOString() || result.updated_at,
        } as unknown as GalleryItem;
    },

    async getAll(maxItems = 100): Promise<GalleryItem[]> {
        const q = query(collection(db, 'gallery'), orderBy('created_at', 'desc'), limit(maxItems));
        const snap = await getDocs(q);
        return snap.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                created_at: data.created_at?.toDate?.()?.toISOString() || data.created_at,
                updated_at: data.updated_at?.toDate?.()?.toISOString() || data.updated_at,
            } as unknown as GalleryItem;
        });
    },

    async getByUserId(userId: string): Promise<GalleryItem[]> {
        const q = query(collection(db, 'gallery'), where('user_id', '==', userId), orderBy('created_at', 'desc'));
        const snap = await getDocs(q);
        return snap.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                created_at: data.created_at?.toDate?.()?.toISOString() || data.created_at,
                updated_at: data.updated_at?.toDate?.()?.toISOString() || data.updated_at,
            } as unknown as GalleryItem;
        });
    },

    async update(id: string, updates: GalleryItemUpdate): Promise<GalleryItem | null> {
        const docRef = doc(db, 'gallery', id);
        await updateDoc(docRef, {
            ...updates,
            updated_at: serverTimestamp(),
        });
        const snap = await getDoc(docRef);
        const data = snap.data();
        if (!data) return null;
        return {
            id: snap.id,
            ...data,
            created_at: data.created_at?.toDate?.()?.toISOString() || data.created_at,
            updated_at: data.updated_at?.toDate?.()?.toISOString() || data.updated_at,
        } as unknown as GalleryItem;
    },

    async delete(id: string): Promise<void> {
        await deleteDoc(doc(db, 'gallery', id));
    }
};

export const chatDB = {
    async create(data: ChatMessageCreate): Promise<ChatMessage> {
        const docRef = await addDoc(collection(db, 'chat'), {
            ...data,
            created_at: serverTimestamp(),
        });
        const snap = await getDoc(docRef);
        const result = snap.data()!;
        return {
            id: snap.id,
            ...result,
            created_at: result.created_at?.toDate?.()?.toISOString() || result.created_at,
        } as unknown as ChatMessage;
    },

    async getAll(maxItems = 100): Promise<ChatMessage[]> {
        const q = query(collection(db, 'chat'), orderBy('created_at', 'desc'), limit(maxItems));
        const snap = await getDocs(q);
        return snap.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                created_at: data.created_at?.toDate?.()?.toISOString() || data.created_at,
            } as unknown as ChatMessage;
        });
    },
};

export const auditDB = {
    async create(data: AuditLogCreate): Promise<AuditLog> {
        const docRef = await addDoc(collection(db, 'audit_logs'), {
            ...data,
            created_at: serverTimestamp(),
        });
        const snap = await getDoc(docRef);
        const result = snap.data()!;
        return {
            id: snap.id,
            ...result,
            created_at: result.created_at?.toDate?.()?.toISOString() || result.created_at,
        } as unknown as AuditLog;
    },

    async getAll(maxItems = 100): Promise<AuditLog[]> {
        const q = query(collection(db, 'audit_logs'), orderBy('created_at', 'desc'), limit(maxItems));
        const snap = await getDocs(q);
        return snap.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                created_at: data.created_at?.toDate?.()?.toISOString() || data.created_at,
            } as unknown as AuditLog;
        });
    },
};

export const firebaseDB = {
    users: userDB,
    profiles: profileDB,
    announcements: announcementDB,
    gallery: galleryDB,
    chat: chatDB,
    audit: auditDB,
};

export default firebaseDB;
