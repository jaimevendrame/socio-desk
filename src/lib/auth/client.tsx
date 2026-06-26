'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export interface ServerSession {
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    tenantId?: string;
  };
  session: {
    id: string;
    expiresAt: string;
  };
}

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

export function AuthProvider({
  children,
  initialSession,
}: {
  children: ReactNode;
  initialSession?: ServerSession | null;
}) {
  const [user, setUser] = useState<User | null>(
    initialSession?.user ? {
      id: initialSession.user.id,
      name: initialSession.user.name,
      email: initialSession.user.email,
      image: initialSession.user.image,
      tenantId: initialSession.user.tenantId,
    } : null
  );
  const [session, setSession] = useState<Session['session'] | null>(
    initialSession?.session ? {
      id: initialSession.session.id,
      expiresAt: initialSession.session.expiresAt,
    } : null
  );
  const [isLoading, setIsLoading] = useState(!initialSession);

  useEffect(() => {
    if (initialSession) return;
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
