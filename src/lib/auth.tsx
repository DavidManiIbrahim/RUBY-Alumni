// Browser-compatible localStorage auth - NO Supabase, NO Redis
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

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
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasFetchedProfile, setHasFetchedProfile] = useState(false);

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('ruby_user');
    const storedProfile = localStorage.getItem('ruby_profile');

    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    if (storedProfile) {
      setProfile(JSON.parse(storedProfile));
    }

    setHasFetchedProfile(true);
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      // Simple localStorage-based auth
      const users = JSON.parse(localStorage.getItem('ruby_users') || '[]');
      const foundUser = users.find((u: any) => u.email === email && u.password === password);

      if (!foundUser) {
        return { error: new Error('Invalid email or password') };
      }

      const user: User = {
        id: foundUser.id,
        email: foundUser.email,
        role: foundUser.role,
        created_at: foundUser.created_at
      };

      setUser(user);
      localStorage.setItem('ruby_user', JSON.stringify(user));

      // Load profile
      const profiles = JSON.parse(localStorage.getItem('ruby_profiles') || '[]');
      const userProfile = profiles.find((p: any) => p.user_id === user.id);
      if (userProfile) {
        setProfile(userProfile);
        localStorage.setItem('ruby_profile', JSON.stringify(userProfile));
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signUp = async (email: string, password: string, fullName: string, isAdmin: boolean = false) => {
    try {
      const users = JSON.parse(localStorage.getItem('ruby_users') || '[]');

      // Check if user exists
      if (users.find((u: any) => u.email === email)) {
        return { error: new Error('User already exists') };
      }

      const newUser = {
        id: crypto.randomUUID(),
        email,
        password, // In production, this should be hashed
        role: isAdmin ? 'admin' : 'user',
        created_at: new Date().toISOString()
      };

      users.push(newUser);
      localStorage.setItem('ruby_users', JSON.stringify(users));

      const user: User = {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role as 'admin' | 'user',
        created_at: newUser.created_at
      };

      setUser(user);
      localStorage.setItem('ruby_user', JSON.stringify(user));

      // Create an initial profile
      const profiles = JSON.parse(localStorage.getItem('ruby_profiles') || '[]');
      const newProfile: Profile = {
        user_id: user.id,
        full_name: fullName,
        email_address: email,
        profile_picture_url: null,
        bio: null,
        graduation_year: null,
        phone_number: null,
        current_location: null,
        position_held: null,
        approval_status: isAdmin ? 'approved' : 'pending',
        is_complete: false,
      };
      profiles.push(newProfile);
      localStorage.setItem('ruby_profiles', JSON.stringify(profiles));
      setProfile(newProfile);
      localStorage.setItem('ruby_profile', JSON.stringify(newProfile));

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    setUser(null);
    setProfile(null);
    localStorage.removeItem('ruby_user');
    localStorage.removeItem('ruby_profile');
  };

  const isAdmin = user?.role === 'admin' || profile?.user_id === 'admin' || false; // Broadened admin check
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
