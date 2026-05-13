"use client";
import {
  createContext, useContext, useEffect, useRef, useState, useCallback, type ReactNode,
} from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { setRequireAuth } from "./authGate";
import AuthGateModal from "@/components/ui/AuthGateModal";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthCtx = createContext<AuthContextValue>({
  user: null,
  session: null,
  loading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const pendingResolveRef = useRef<((value: boolean) => void) | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    // NEXT_PUBLIC_SITE_URL must be set in Vercel env vars to your deployment URL
    // (e.g. https://my-app.vercel.app). Without it Supabase falls back to its
    // configured Site URL which may be localhost, causing the post-OAuth redirect
    // to land on localhost instead of your deployed app.
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${siteUrl}/auth/callback?next=/`,
        queryParams: { access_type: "offline", prompt: "consent" },
      },
    });
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    window.location.href = "/profile";
  }, []);

  // Register the module-level gate once the provider mounts.
  // Non-React code (store actions) calls requireAuth() which invokes this.
  useEffect(() => {
    setRequireAuth((): Promise<boolean> => {
      // Already signed in — no gate needed
      if (user) return Promise.resolve(true);

      return new Promise<boolean>((resolve) => {
        pendingResolveRef.current = resolve;
        setShowModal(true);
      });
    });
  }, [user]);

  const handleSignIn = useCallback(() => {
    // Resolve pending gate promise (page will redirect, action won't complete this session)
    pendingResolveRef.current?.(false);
    pendingResolveRef.current = null;
    setShowModal(false);
    signInWithGoogle();
  }, [signInWithGoogle]);

  const handleCancel = useCallback(() => {
    pendingResolveRef.current?.(false);
    pendingResolveRef.current = null;
    setShowModal(false);
  }, []);

  return (
    <AuthCtx.Provider value={{ user, session, loading, signInWithGoogle, signOut }}>
      {children}
      {showModal && (
        <AuthGateModal onSignIn={handleSignIn} onCancel={handleCancel} />
      )}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  return useContext(AuthCtx);
}
