'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { onAuthChange, getUserProfile } from '@/lib/firebase';
import { UserProfile } from '@/types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // Failsafe: if Firebase auth state doesn't resolve in 2 seconds, stop loading
    const timer = setTimeout(() => {
      if (isMounted) setLoading(false);
    }, 2000);

    const unsub = onAuthChange(async (firebaseUser) => {
      if (!isMounted) return;
      setUser(firebaseUser);
      
      // Stop loading immediately so the user can see the UI
      setLoading(false);
      clearTimeout(timer);

      if (firebaseUser) {
        try {
          const p = await getUserProfile(firebaseUser.uid);
          if (isMounted) setProfile(p);
        } catch (error) {
          console.warn("Failed to fetch user profile:", error);
          if (isMounted) setProfile(null);
        }
      } else {
        if (isMounted) setProfile(null);
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(timer);
      unsub();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
