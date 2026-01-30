
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  User as FirebaseUser
} from 'firebase/auth';
import { auth } from './firebase';
import { profileDB } from './firebaseDB';

export interface User {
  id: string;
  email: string;
  role?: 'admin' | 'user';
  created_at: string;
}

export interface Profile {
  user_id: string;
  full_name: string | null;
  email_address: string | null;
  profile_picture_url: string | null;
  bio: string | null;
  graduation_year: number | null;
  phone_number: string | null;
  current_location: string | null;
  position_held: string | null;
  approval_status: 'pending' | 'approved' | 'rejected';
  is_complete: boolean;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  isProfileComplete: boolean;
  hasFetchedProfile: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string, isAdmin?: boolean) => Promise<{ error: Error | null }>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasFetchedProfile, setHasFetchedProfile] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in
        const user: User = {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          role: 'user', // Default, will be updated by profile
          created_at: firebaseUser.metadata.creationTime || new Date().toISOString(),
        };
        setUser(user);

        // Fetch profile
        try {
          const userProfile = await profileDB.getByUserId(firebaseUser.uid);
          if (userProfile) {
            // Adapt Firestore profile to Auth Profile type
            const adaptedProfile: Profile = {
              user_id: firebaseUser.uid,
              full_name: userProfile.full_name,
              email_address: userProfile.email_address || firebaseUser.email,
              profile_picture_url: userProfile.profile_picture_url,
              bio: userProfile.bio,
              graduation_year: userProfile.graduation_year,
              phone_number: userProfile.phone_number,
              current_location: userProfile.current_location,
              position_held: userProfile.position_held,
              approval_status: userProfile.approval_status,
              is_complete: !!(userProfile.full_name && userProfile.graduation_year),
            };
            setProfile(adaptedProfile);

            // Update user role if profile specifies it (Firestore profile could have a role field)
            if ((userProfile as any).role) {
              setUser(prev => prev ? { ...prev, role: (userProfile as any).role } : null);
            } else if (adaptedProfile.approval_status === 'approved' && (userProfile as any).isAdmin) {
              setUser(prev => prev ? { ...prev, role: 'admin' } : null);
            }
          }
        } catch (error) {
          console.error("Error fetching profile:", error);
        }
      } else {
        // User is signed out
        setUser(null);
        setProfile(null);
      }
      setHasFetchedProfile(true);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signUp = async (email: string, password: string, fullName: string, isAdmin: boolean = false) => {
    try {
      const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, password);

      // Create profile in Firestore
      const newProfile = {
        user_id: firebaseUser.uid,
        full_name: fullName,
        email_address: email,
        approval_status: isAdmin ? 'approved' : 'pending',
        is_complete: false,
        isAdmin: isAdmin,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await profileDB.create(newProfile);

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  const isAdmin = user?.role === 'admin' || (profile as any)?.isAdmin || false;
  const isProfileComplete = profile?.is_complete || false;

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isAdmin,
        isProfileComplete,
        hasFetchedProfile,
        signIn,
        signUp,
        resetPassword,
        signOut,
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
