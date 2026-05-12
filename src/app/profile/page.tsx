"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { getProfileId } from "@/lib/cache";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import {
  LogOut, User, Mail, Calendar, Shield,
  CheckCircle, Loader2, Globe,
} from "lucide-react";

export default function ProfilePage() {
  const { user, loading, signInWithGoogle, signOut } = useAuth();
  const [signingIn, setSigningIn] = useState(false);
  const [guestId, setGuestId] = useState("");

  useEffect(() => {
    setGuestId(getProfileId());
  }, []);

  const handleSignIn = async () => {
    setSigningIn(true);
    await signInWithGoogle();
    // Page will reload after OAuth redirect; signingIn stays true during redirect
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <Loader2 size={28} className="animate-spin text-slate-400" />
      </div>
    );
  }

  // ── Logged in ──────────────────────────────────────────────
  if (user) {
    const name = user.user_metadata?.full_name ?? user.user_metadata?.name ?? "User";
    const email = user.email ?? "";
    const avatar = user.user_metadata?.avatar_url ?? user.user_metadata?.picture ?? null;
    const provider = user.app_metadata?.provider ?? "google";
    const createdAt = new Date(user.created_at).toLocaleDateString("en-US", {
      year: "numeric", month: "long", day: "numeric",
    });

    return (
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Profile</h1>
          <p className="text-slate-400 text-sm mt-1">Your account details</p>
        </div>

        {/* Avatar + identity */}
        <Card>
          <div className="flex items-center gap-5">
            {avatar ? (
              <img
                src={avatar}
                alt={name}
                className="w-16 h-16 rounded-full ring-2 ring-slate-600"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center">
                <User size={28} className="text-slate-400" />
              </div>
            )}
            <div>
              <p className="text-xl font-semibold">{name}</p>
              <p className="text-slate-400 text-sm">{email}</p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <CheckCircle size={13} className="text-emerald-400" />
                <span className="text-xs text-emerald-400 capitalize">
                  Connected via {provider}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Account info */}
        <Card>
          <h2 className="text-base font-semibold mb-4">Account Details</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Mail size={15} className="text-slate-500 shrink-0" />
              <span className="text-slate-400 w-24">Email</span>
              <span>{email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Calendar size={15} className="text-slate-500 shrink-0" />
              <span className="text-slate-400 w-24">Member since</span>
              <span>{createdAt}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Shield size={15} className="text-slate-500 shrink-0" />
              <span className="text-slate-400 w-24">User ID</span>
              <span className="font-mono text-xs text-slate-500 truncate">{user.id}</span>
            </div>
          </div>
        </Card>

        {/* Data info */}
        <Card>
          <h2 className="text-base font-semibold mb-2">Data Storage</h2>
          <p className="text-sm text-slate-400">
            Your financial data is linked to your Google account and stored in Supabase.
            Signing in on another device will load the same data.
          </p>
        </Card>

        {/* Sign out */}
        <Card className="border-slate-700">
          <h2 className="text-base font-semibold mb-3">Session</h2>
          <Button variant="secondary" onClick={signOut}>
            <LogOut size={15} /> Sign out
          </Button>
        </Card>
      </div>
    );
  }

  // ── Guest / not logged in ──────────────────────────────────
  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-slate-400 text-sm mt-1">Sign in to sync your data across devices</p>
      </div>

      {/* Sign in card */}
      <Card className="text-center py-10">
        <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center mx-auto mb-4">
          <User size={30} className="text-slate-400" />
        </div>
        <h2 className="text-lg font-semibold mb-2">Sign in with Google</h2>
        <p className="text-slate-400 text-sm mb-6 max-w-sm mx-auto">
          Connect your Google account to sync your financial data across all your devices and keep it safely backed up.
        </p>
        <Button onClick={handleSignIn} disabled={signingIn} size="lg" className="mx-auto">
          {signingIn ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Globe size={18} />
          )}
          {signingIn ? "Redirecting to Google…" : "Continue with Google"}
        </Button>
      </Card>

      {/* Guest mode info */}
      <Card>
        <h2 className="text-base font-semibold mb-2">Currently in Guest Mode</h2>
        <p className="text-sm text-slate-400 mb-3">
          Your data is saved locally and synced to Supabase using an anonymous ID.
          Signing in with Google will create a persistent account linked to your email.
        </p>
        <div className="bg-slate-700/50 rounded-lg p-3">
          <p className="text-xs text-slate-500 mb-1">Guest profile ID</p>
          <p className="font-mono text-xs text-slate-400 break-all">{guestId}</p>
        </div>
      </Card>
    </div>
  );
}
