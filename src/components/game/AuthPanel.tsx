'use client';

import { useEffect, useMemo, useState } from 'react';

import type { AuthUser } from '@/lib/supabase/browser';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

type Identity = {
  userId?: string;
  email?: string;
};

type AuthPanelProps = {
  displayName: string;
  localMode: boolean;
  onDisplayNameChange: (value: string) => void;
  onIdentityChange: (identity: Identity) => void;
};

export function AuthPanel({ displayName, localMode, onDisplayNameChange, onIdentityChange }: AuthPanelProps) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [emailInput, setEmailInput] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!supabase) {
      onIdentityChange({});
      return;
    }

    let isMounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (isMounted) {
        setUser(data.user ? { id: data.user.id, email: data.user.email } : null);
      }
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? { id: session.user.id, email: session.user.email } : null);
    });

    return () => {
      isMounted = false;
      data.subscription.unsubscribe();
    };
  }, [supabase, onIdentityChange]);

  useEffect(() => {
    onIdentityChange({ userId: user?.id, email: user?.email ?? undefined });
  }, [user, onIdentityChange]);

  async function handleEmailSignIn() {
    if (!supabase || !emailInput.trim()) {
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({
      email: emailInput.trim(),
      options: {
        emailRedirectTo: typeof window !== 'undefined' ? window.location.href : undefined,
      },
    });

    if (error) {
      setNotice(error.message);
      return;
    }

    setNotice('Check your email for the magic link.');
  }

  async function handleSignOut() {
    if (!supabase) {
      return;
    }

    await supabase.auth.signOut();
    setNotice('Signed out.');
  }

  return (
    <section className="rounded-2xl border border-[var(--wr-border)] bg-[var(--wr-surface)] p-4">
      <p className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-[var(--wr-text-muted)]">Player</p>

      <label className="mb-2 block text-sm text-[var(--wr-text-primary)]" htmlFor="display-name-input">
        Display name
      </label>
      <input
        id="display-name-input"
        value={displayName}
        maxLength={32}
        onChange={(event) => onDisplayNameChange(event.target.value)}
        placeholder="Pick a nickname"
        className="mb-4 w-full rounded-lg border border-[var(--wr-border)] bg-[var(--wr-surface-strong)] px-3 py-2 text-sm text-[var(--wr-text-primary)] outline-none transition focus:border-[var(--wr-accent)]"
      />

      {!supabase ? (
        <p className="text-xs text-[var(--wr-text-muted)]">
          Auth disabled. {localMode ? 'Running in local data mode.' : 'Add Supabase env vars to enable sign-in.'}
        </p>
      ) : user ? (
        <div className="space-y-2">
          <p className="text-sm text-[var(--wr-success)]">Signed in as {user.email}</p>
          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-md border border-[var(--wr-border)] px-3 py-1 text-sm text-[var(--wr-text-primary)] transition hover:border-[var(--wr-text-muted)]"
          >
            Sign out
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <label className="block text-sm text-[var(--wr-text-primary)]" htmlFor="email-input">
            Sign in (optional)
          </label>
          <input
            id="email-input"
            type="email"
            value={emailInput}
            onChange={(event) => setEmailInput(event.target.value)}
            placeholder="name@example.com"
            className="w-full rounded-lg border border-[var(--wr-border)] bg-[var(--wr-surface-strong)] px-3 py-2 text-sm text-[var(--wr-text-primary)] outline-none transition focus:border-[var(--wr-accent)]"
          />
          <button
            type="button"
            onClick={handleEmailSignIn}
            className="rounded-md bg-[var(--wr-accent)] px-3 py-1 text-sm font-semibold text-[var(--wr-accent-contrast)] transition hover:bg-[var(--wr-accent-strong)]"
          >
            Send magic link
          </button>
        </div>
      )}

      {notice ? <p className="mt-3 text-xs text-[var(--wr-text-muted)]">{notice}</p> : null}
    </section>
  );
}
