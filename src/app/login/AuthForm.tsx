'use client';

import { useState, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { KeyRound, Mail, Sparkles } from 'lucide-react';
import {
  signInWithEmail,
  signInWithPassword,
  signUpWithPassword,
} from '@/lib/actions/rankings';

type AuthMode = 'signin' | 'signup' | 'magic';

type Props = {
  defaultMode?: 'signin' | 'signup';
};

export default function AuthForm({ defaultMode = 'signin' }: Props) {
  const [mode, setMode] = useState<AuthMode>(defaultMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [sent, setSent] = useState(false);
  const [signupPending, setSignupPending] = useState(false);
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();
  const searchParams = useSearchParams();
  const authError = searchParams.get('error');
  const redirectTo = searchParams.get('redirect') || '/';

  function resetFormState() {
    setError('');
    setSent(false);
    setSignupPending(false);
  }

  function switchMode(next: AuthMode) {
    resetFormState();
    setMode(next);
  }

  function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (mode === 'signup' && password !== confirmPassword) {
      setError('Passwörter stimmen nicht überein.');
      return;
    }

    if (password.length < 6) {
      setError('Passwort muss mindestens 6 Zeichen haben.');
      return;
    }

    startTransition(async () => {
      try {
        if (mode === 'signup') {
          const result = await signUpWithPassword(email, password);
          if (result.needsConfirmation) {
            setSignupPending(true);
          }
        } else {
          await signInWithPassword(email, password, redirectTo);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Anmeldung fehlgeschlagen');
      }
    });
  }

  function handleMagicLinkSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    startTransition(async () => {
      try {
        await signInWithEmail(email);
        setSent(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Login fehlgeschlagen');
      }
    });
  }

  const title =
    mode === 'signup'
      ? 'Konto erstellen'
      : mode === 'magic'
        ? 'Magic Link'
        : 'Willkommen zurück';

  const subtitle =
    mode === 'signup'
      ? 'Registriere dich mit E-Mail und Passwort.'
      : mode === 'magic'
        ? 'Link per E-Mail — kein Passwort nötig.'
        : 'Melde dich mit E-Mail und Passwort an.';

  return (
    <div className="max-w-md mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8 space-y-6"
      >
        <div className="text-center space-y-2">
          <Sparkles className="w-10 h-10 mx-auto text-[var(--line-energy)]" />
          <h1 className="font-display text-2xl font-bold">{title}</h1>
          <p className="text-muted text-sm">{subtitle}</p>
        </div>

        {authError && (
          <p className="text-red-400 text-sm text-center bg-red-500/10 p-3 rounded-lg">
            Auth fehlgeschlagen. Bitte erneut versuchen.
          </p>
        )}

        {mode !== 'magic' && (
          <div className="flex rounded-xl bg-[var(--bg-elevated)] p-1 border border-[var(--glass-border)]">
            <button
              type="button"
              onClick={() => switchMode('signin')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === 'signin'
                  ? 'bg-[var(--line-energy)] text-white'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              Anmelden
            </button>
            <button
              type="button"
              onClick={() => switchMode('signup')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === 'signup'
                  ? 'bg-[var(--line-energy)] text-white'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              Registrieren
            </button>
          </div>
        )}

        {signupPending ? (
          <div className="text-center space-y-2 py-4">
            <Mail className="w-8 h-8 mx-auto text-[var(--line-iced-tea)]" />
            <p className="font-medium">Bestätige deine E-Mail</p>
            <p className="text-sm text-muted">
              Wir haben einen Link an <strong>{email}</strong> gesendet. Klicke darauf, um dein
              Konto zu aktivieren.
            </p>
            <button
              type="button"
              onClick={() => switchMode('signin')}
              className="text-sm text-[var(--line-energy)] hover:underline mt-2"
            >
              Zur Anmeldung
            </button>
          </div>
        ) : sent ? (
          <div className="text-center space-y-2 py-4">
            <Mail className="w-8 h-8 mx-auto text-[var(--line-iced-tea)]" />
            <p className="font-medium">Check dein Postfach!</p>
            <p className="text-sm text-muted">
              Wir haben einen Link an <strong>{email}</strong> gesendet.
            </p>
          </div>
        ) : mode === 'magic' ? (
          <form onSubmit={handleMagicLinkSubmit} className="space-y-4">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="deine@email.de"
              autoComplete="email"
              className="w-full px-4 py-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--glass-border)] focus:outline-none focus:ring-2 focus:ring-[var(--line-energy)]/50 touch-target"
            />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={pending}
              className="w-full touch-target py-3 rounded-xl bg-[var(--line-energy)] text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {pending ? 'Senden...' : 'Magic Link senden'}
            </button>
            <button
              type="button"
              onClick={() => switchMode('signin')}
              className="w-full text-sm text-muted hover:text-foreground"
            >
              Zurück zur Passwort-Anmeldung
            </button>
          </form>
        ) : (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="deine@email.de"
              autoComplete="email"
              className="w-full px-4 py-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--glass-border)] focus:outline-none focus:ring-2 focus:ring-[var(--line-energy)]/50 touch-target"
            />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Passwort"
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              minLength={6}
              className="w-full px-4 py-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--glass-border)] focus:outline-none focus:ring-2 focus:ring-[var(--line-energy)]/50 touch-target"
            />
            {mode === 'signup' && (
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Passwort bestätigen"
                autoComplete="new-password"
                minLength={6}
                className="w-full px-4 py-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--glass-border)] focus:outline-none focus:ring-2 focus:ring-[var(--line-energy)]/50 touch-target"
              />
            )}
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={pending}
              className="w-full touch-target py-3 rounded-xl bg-[var(--line-energy)] text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {pending
                ? 'Bitte warten...'
                : mode === 'signup'
                  ? 'Registrieren'
                  : 'Anmelden'}
            </button>
            {mode === 'signin' && (
              <div className="flex flex-col items-center gap-2 text-sm">
                <button
                  type="button"
                  onClick={() => switchMode('magic')}
                  className="text-muted hover:text-foreground inline-flex items-center gap-1"
                >
                  <Mail className="w-4 h-4" />
                  Stattdessen Magic Link
                </button>
                {defaultMode === 'signin' && (
                  <p className="text-muted">
                    Noch kein Konto?{' '}
                    <Link href="/register" className="text-[var(--line-energy)] hover:underline">
                      Registrieren
                    </Link>
                  </p>
                )}
              </div>
            )}
            {mode === 'signup' && defaultMode === 'signup' && (
              <p className="text-center text-sm text-muted">
                Schon registriert?{' '}
                <Link href="/login" className="text-[var(--line-energy)] hover:underline">
                  Anmelden
                </Link>
              </p>
            )}
          </form>
        )}

        {mode === 'signin' && !sent && !signupPending && (
          <p className="text-center text-xs text-muted flex items-center justify-center gap-1">
            <KeyRound className="w-3 h-3" />
            Passwort-Anmeldung über Supabase Auth
          </p>
        )}
      </motion.div>
    </div>
  );
}
