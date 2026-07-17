'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { User } from '@/types';
import {
  clearAuthSession,
  getStoredUser,
  getToken,
  saveAuthSession,
} from '@/lib/auth-session';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => boolean;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const storedToken = getToken();
    const storedUser = getStoredUser();

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(storedUser);
    } else {
      clearAuthSession();
    }

    setLoading(false);
  }, []);

  const login = (newToken: string, newUser: User) => {
    if (!saveAuthSession(newToken, newUser)) {
      return false;
    }

    setToken(newToken);
    setUser(newUser);
    return true;
  };

  const logout = () => {
    clearAuthSession();
    setToken(null);
    setUser(null);
    router.replace('/login');
  };

  useEffect(() => {
    if (loading) return;

    const publicPaths = ['/login', '/register', '/'];
    const path = pathname || '';
    const isPublicPath = publicPaths.includes(path);

    if (!user && !isPublicPath) {
      router.replace('/login');
    } else if (user && isPublicPath) {
      router.replace('/dashboard');
    }
  }, [user, loading, pathname, router]);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
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
