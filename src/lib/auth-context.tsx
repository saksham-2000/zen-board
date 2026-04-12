"use client";

// Handles anonymous guest sessions. Session persists in browser storage so users keep their tasks across page refreshes.

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

interface AuthProviderProps {
  children: ReactNode;
}

interface AuthState {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    void (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!active) return;

      if (sessionData.session?.user) {
        setUser(sessionData.session.user);
        setLoading(false);
      } else {
        const { data, error } = await supabase.auth.signInAnonymously();
        if (!active) return;
        setUser(error ? null : (data.user ?? null));
        setLoading(false);
      }
    })();

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
