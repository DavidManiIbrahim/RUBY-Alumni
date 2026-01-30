import bcrypt from 'bcryptjs';
import { redisClient } from './redis';
import { userDB, profileDB, roleDB, generateId } from './redisDB';

/**
 * Redis-based Authentication System
 * Replaces Supabase Auth
 */

// Session management
const SESSION_TTL = 7 * 24 * 60 * 60; // 7 days in seconds

export interface User {
    id: string;
    email: string;
    password_hash: string;
    full_name: string;
    email_verified: boolean;
    created_at: string;
    updated_at: string;
}

export interface Session {
    id: string;
    user_id: string;
    expires_at: string;
    created_at: string;
}

// Helper to hash passwords
const hashPassword = async (password: string): Promise<string> => {
    return await bcrypt.hash(password, 10);
};

// Helper to verify passwords
const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
    return await bcrypt.compare(password, hash);
};

// Authentication operations
export const auth = {
    // Sign up new user
    async signUp(email: string, password: string, fullName: string) {
        try {
            // Check if user already exists
            const existingUser = await userDB.getByEmail(email);
            if (existingUser) {
                return { user: null, session: null, error: new Error('User already exists') };
            }

            // Hash password
            const password_hash = await hashPassword(password);

            // Create user
            const user = await userDB.create({
                email,
                password_hash,
                full_name: fullName,
                email_verified: false,
            });

            // Create profile
            await profileDB.create({
                user_id: user.id,
                full_name: fullName,
                email_address: email,
                approval_status: 'pending',
            });

            // Create session
            const session = await this.createSession(user.id);

            return { user, session, error: null };
        } catch (error) {
            return { user: null, session: null, error: error as Error };
        }
    },

    // Sign in existing user
    async signIn(email: string, password: string) {
        try {
            // Get user by email
            const user = await userDB.getByEmail(email);
            if (!user) {
                return { user: null, session: null, error: new Error('Invalid credentials') };
            }

            // Verify password
            const isValid = await verifyPassword(password, user.password_hash);
            if (!isValid) {
                return { user: null, session: null, error: new Error('Invalid credentials') };
            }

            // Create session
            const session = await this.createSession(user.id);

            return { user, session, error: null };
        } catch (error) {
            return { user: null, session: null, error: error as Error };
        }
    },

    // Create session
    async createSession(userId: string): Promise<Session> {
        const sessionId = generateId();
        const expiresAt = new Date(Date.now() + SESSION_TTL * 1000).toISOString();

        const session: Session = {
            id: sessionId,
            user_id: userId,
            expires_at: expiresAt,
            created_at: new Date().toISOString(),
        };

        // Store session in Redis
        await redisClient.set(
            `session:${sessionId}`,
            JSON.stringify(session),
            { EX: SESSION_TTL }
        );

        // Add to user's sessions
        await redisClient.sAdd(`user:${userId}:sessions`, sessionId);

        return session;
    },

    // Get session
    async getSession(sessionId: string): Promise<Session | null> {
        const data = await redisClient.get(`session:${sessionId}`);
        if (!data) return null;

        const session = JSON.parse(data);

        // Check if expired
        if (new Date(session.expires_at) < new Date()) {
            await this.deleteSession(sessionId);
            return null;
        }

        return session;
    },

    // Get user from session
    async getUserFromSession(sessionId: string) {
        const session = await this.getSession(sessionId);
        if (!session) return null;

        return await userDB.getById(session.user_id);
    },

    // Delete session (sign out)
    async deleteSession(sessionId: string) {
        const session = await this.getSession(sessionId);
        if (session) {
            await redisClient.sRem(`user:${session.user_id}:sessions`, sessionId);
        }
        await redisClient.del(`session:${sessionId}`);
    },

    // Sign out
    async signOut(sessionId: string) {
        await this.deleteSession(sessionId);
        return { error: null };
    },

    // Reset password request
    async resetPasswordRequest(email: string) {
        try {
            const user = await userDB.getByEmail(email);
            if (!user) {
                // Don't reveal if user exists
                return { error: null };
            }

            // Generate reset token
            const resetToken = generateId();
            const expiresAt = new Date(Date.now() + 3600000).toISOString(); // 1 hour

            // Store reset token
            await redisClient.set(
                `password_reset:${resetToken}`,
                JSON.stringify({ user_id: user.id, expires_at: expiresAt }),
                { EX: 3600 } // 1 hour
            );

            // In production, send email with reset link
            console.log(`Password reset token for ${email}: ${resetToken}`);

            return { error: null, resetToken };
        } catch (error) {
            return { error: error as Error };
        }
    },

    // Reset password with token
    async resetPassword(token: string, newPassword: string) {
        try {
            const data = await redisClient.get(`password_reset:${token}`);
            if (!data) {
                return { error: new Error('Invalid or expired reset token') };
            }

            const resetData = JSON.parse(data);

            // Check if expired
            if (new Date(resetData.expires_at) < new Date()) {
                await redisClient.del(`password_reset:${token}`);
                return { error: new Error('Reset token has expired') };
            }

            // Hash new password
            const password_hash = await hashPassword(newPassword);

            // Update user password
            await userDB.update(resetData.user_id, { password_hash });

            // Delete reset token
            await redisClient.del(`password_reset:${token}`);

            return { error: null };
        } catch (error) {
            return { error: error as Error };
        }
    },

    // Update password
    async updatePassword(userId: string, currentPassword: string, newPassword: string) {
        try {
            const user = await userDB.getById(userId);
            if (!user) {
                return { error: new Error('User not found') };
            }

            // Verify current password
            const isValid = await verifyPassword(currentPassword, user.password_hash);
            if (!isValid) {
                return { error: new Error('Current password is incorrect') };
            }

            // Hash new password
            const password_hash = await hashPassword(newPassword);

            // Update password
            await userDB.update(userId, { password_hash });

            return { error: null };
        } catch (error) {
            return { error: error as Error };
        }
    },

    // Verify email
    async verifyEmail(userId: string) {
        await userDB.update(userId, { email_verified: true });
        return { error: null };
    },

    // Get user
    async getUser(userId: string) {
        return await userDB.getById(userId);
    },

    // Update user
    async updateUser(userId: string, updates: Partial<User>) {
        // Don't allow password updates through this method
        const { password_hash, ...safeUpdates } = updates as any;
        return await userDB.update(userId, safeUpdates);
    },
};

export default auth;
