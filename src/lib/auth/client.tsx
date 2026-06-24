'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface User {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  tenantId?: string;
}

interface Session {
  user: User;
  session: {
    id: string;
    expiresAt: string;
  };
}

interface AuthContextType {
  user: User | null;
  session: Session['session'] | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session['session'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    checkSession();
  }, []);

  async function checkSession() {
    try {
      const response = await fetch('/api/auth/get-session');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setSession(data.session);
      }
    } catch (error) {
      console.error('Error checking session:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function signIn(email: string, password: string) {
    try {
      const response = await fetch('/api/auth/sign-in/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.error || 'Erro ao fazer login' };
      }

      setUser(data.user);
      setSession(data.session);
      return { error: null };
    } catch (error) {
      console.error('Error signing in:', error);
      return { error: 'Erro de conexao' };
    }
  }

  async function signOut() {
    try {
      await fetch('/api/auth/sign-out', {
        method: 'POST',
      });
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }

  return (
    <AuthContext.Provider value={{ user, session, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
