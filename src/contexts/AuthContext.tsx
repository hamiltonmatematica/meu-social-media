import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userCredits: number;
  fetchCredits: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userCredits, setUserCredits] = useState<number>(0);

  const fetchCredits = async () => {
    if (!user) return;
    const { data } = await supabase.from('sm_users').select('credits').eq('id', user.id).single();
    if (data) {
      setUserCredits(data.credits || 0);
    }
  };

  useEffect(() => {
    if (user) {
      fetchCredits();
    }
  }, [user]);

  useEffect(() => {
    // Verificar sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        ensureProfile(session.user);
      }
      setLoading(false);
    });

    // Escutar mudanças de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          ensureProfile(session.user);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Garante que o perfil do user exista na tabela sm_users
  const ensureProfile = async (user: User) => {
    const { data } = await supabase
      .from('sm_users')
      .select('id')
      .eq('id', user.id)
      .single();

    if (!data) {
      await supabase.from('sm_users').insert({
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'Usuário',
        credits: 2, // 2 créditos grátis no início
        created_at: new Date().toISOString(),
      });
      setUserCredits(2);
    } else {
      fetchCredits();
    }

    // Atualizar último login
    await supabase
      .from('sm_users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', user.id);
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message === 'Invalid login credentials' ? 'Email ou senha incorretos' : error.message };
    return { error: null };
  };

  const signUp = async (email: string, password: string, name: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name }
      }
    });
    if (error) {
      if (error.message.includes('already registered')) return { error: 'Este email já está cadastrado' };
      return { error: error.message };
    }
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const sendPasswordReset = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) return { error: error.message };
    return { error: null };
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, userCredits, fetchCredits, signIn, signUp, signOut, sendPasswordReset }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
