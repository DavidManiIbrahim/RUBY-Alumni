import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import auth, { User, Session } from '@/lib/redisAuth';
import { profileDB, roleDB } from '@/lib/redisDB';
import { initRedis } from '@/lib/redis';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
    signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
    resetPassword: (email: string) => Promise<{ error: Error | null }>;
    updatePassword: (currentPassword: string, newPassword: string) => Promise<{ error: Error | null }>;
    signOut: () => Promise<void>;
    isAdmin: boolean;
    approvalStatus: 'pending' | 'approved' | 'rejected' | null;
    profile: Profile | null;
    refreshProfile: () => Promise<void>;
    isProfileComplete: boolean;
    hasFetchedProfile: boolean;
}

interface Profile {
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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [approvalStatus, setApprovalStatus] = useState<'pending' | 'approved' | 'rejected' | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [isProfileComplete, setIsProfileComplete] = useState(false);
    const [hasFetchedProfile, setHasFetchedProfile] = useState(false);

    const navigate = useNavigate();

    // Initialize Redis and restore session
    useEffect(() => {
        const initAuth = async () => {
            try {
                // Initialize Redis connection
                await initRedis();

                // Try to restore session from localStorage
                const sessionId = localStorage.getItem('session_id');
                if (sessionId) {
                    const restoredSession = await auth.getSession(sessionId);
                    if (restoredSession) {
                        const restoredUser = await auth.getUserFromSession(sessionId);
                        if (restoredUser) {
                            setSession(restoredSession);
                            setUser(restoredUser);
                            await loadUserData(restoredUser.id);
                        } else {
                            localStorage.removeItem('session_id');
                        }
                    } else {
                        localStorage.removeItem('session_id');
                    }
                }
            } catch (error) {
                console.error('Auth initialization error:', error);
            } finally {
                setLoading(false);
            }
        };

        initAuth();
    }, []);

    // Load user data (profile, role, etc.)
    const loadUserData = async (userId: string) => {
        try {
            // Fetch profile
            const userProfile = await profileDB.getByUserId(userId);
            if (userProfile) {
                setProfile(userProfile as Profile);
                setApprovalStatus(userProfile.approval_status as 'pending' | 'approved' | 'rejected');

                const complete = !!(
                    userProfile.full_name &&
                    userProfile.email_address &&
                    userProfile.graduation_year &&
                    userProfile.profile_picture_url
                );
                setIsProfileComplete(complete);
            }

            // Fetch role
            const adminStatus = await roleDB.isAdmin(userId);
            setIsAdmin(adminStatus);

            setHasFetchedProfile(true);
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    };

    const refreshProfile = async () => {
        if (user) {
            await loadUserData(user.id);
        }
    };

    const signUp = async (email: string, password: string, fullName: string) => {
        try {
            const { user: newUser, session: newSession, error } = await auth.signUp(email, password, fullName);

            if (error) return { error };

            if (newUser && newSession) {
                setUser(newUser);
                setSession(newSession);
                localStorage.setItem('session_id', newSession.id);
                await loadUserData(newUser.id);
            }

            return { error: null };
        } catch (error) {
            return { error: error as Error };
        }
    };

    const signIn = async (email: string, password: string) => {
        try {
            const { user: signedInUser, session: newSession, error } = await auth.signIn(email, password);

            if (error) return { error };

            if (signedInUser && newSession) {
                setUser(signedInUser);
                setSession(newSession);
                localStorage.setItem('session_id', newSession.id);
                await loadUserData(signedInUser.id);
            }

            return { error: null };
        } catch (error) {
            return { error: error as Error };
        }
    };

    const resetPassword = async (email: string) => {
        try {
            const { error } = await auth.resetPasswordRequest(email);
            return { error };
        } catch (error) {
            return { error: error as Error };
        }
    };

    const updatePassword = async (currentPassword: string, newPassword: string) => {
        if (!user) return { error: new Error('Not authenticated') };

        try {
            const { error } = await auth.updatePassword(user.id, currentPassword, newPassword);
            return { error };
        } catch (error) {
            return { error: error as Error };
        }
    };

    const signOut = async () => {
        if (session) {
            await auth.signOut(session.id);
        }

        setUser(null);
        setSession(null);
        setProfile(null);
        setIsAdmin(false);
        setApprovalStatus(null);
        setIsProfileComplete(false);

        localStorage.removeItem('session_id');
        navigate('/auth');
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                session,
                loading,
                signUp,
                signIn,
                resetPassword,
                updatePassword,
                signOut,
                isAdmin,
                approvalStatus,
                profile,
                refreshProfile,
                isProfileComplete,
                hasFetchedProfile,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
