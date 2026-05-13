'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle, MessageCircle, RefreshCw, AlertCircle, Users } from 'lucide-react';

import { Header } from '@/components/layout/Header';
import { UserAvatar } from '@/components/feature/users/UserAvatar';
import { FeedbackScore } from '@/components/feature/users/FeedbackScore';
import { UserProfileTabs } from '@/components/feature/users/UserProfileTabs';
import type { ProfileTab } from '@/components/feature/users/UserProfileTabs';
import { authApi } from '@/lib/api/auth-client';
import { useAuthStore } from '@/lib/stores/auth-store';
import type { PublicUserProfile, PublicUserProfileResponse } from '@/types';

interface UserProfileClientProps {
  username: string;
}

function AccountTypeBadge({ type }: { type: 'personal' | 'business' }) {
  if (type === 'business') {
    return (
      <span className="inline-flex items-center rounded-full bg-[#ff7300]/10 px-2.5 py-0.5 text-xs font-semibold text-[#ff7300]">
        Business
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
      Privato
    </span>
  );
}

function formatMemberSince(memberSince: string): string {
  const [year, month] = memberSince.split('-');
  if (!year || !month) return memberSince;
  const months = [
    'gen', 'feb', 'mar', 'apr', 'mag', 'giu',
    'lug', 'ago', 'set', 'ott', 'nov', 'dic',
  ];
  const monthIndex = parseInt(month, 10) - 1;
  return `${months[monthIndex] ?? month} ${year}`;
}

function HeroSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <div className="h-24 w-24 shrink-0 rounded-full bg-slate-200" />
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-40 rounded-lg bg-slate-200" />
            <div className="h-5 w-16 rounded-full bg-slate-200" />
          </div>
          <div className="h-4 w-56 rounded bg-slate-200" />
          <div className="flex gap-4">
            <div className="h-4 w-24 rounded bg-slate-200" />
            <div className="h-4 w-20 rounded bg-slate-200" />
            <div className="h-5 w-16 rounded-full bg-slate-200" />
          </div>
        </div>
      </div>
      <div className="mt-8 space-y-2">
        <div className="h-10 rounded-2xl bg-slate-100" />
        <div className="h-48 rounded-2xl bg-slate-100" />
      </div>
    </div>
  );
}

function NotFoundState({ username }: { username: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
        <Users className="h-8 w-8 text-slate-400" />
      </div>
      <h2 className="mb-2 text-xl font-bold text-slate-900">Utente non trovato</h2>
      <p className="mb-6 max-w-sm text-sm text-slate-500">
        L&apos;utente <span className="font-semibold text-slate-700">@{username}</span> non esiste o
        è stato rimosso.
      </p>
      <Link
        href="/search/user"
        className="rounded-full bg-[#ff7300] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#e56a00]"
      >
        Cerca altri utenti
      </Link>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
        <AlertCircle className="h-8 w-8 text-red-400" />
      </div>
      <h2 className="mb-2 text-xl font-bold text-slate-900">Errore di caricamento</h2>
      <p className="mb-6 text-sm text-slate-500">
        Impossibile caricare il profilo. Controlla la connessione e riprova.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
      >
        <RefreshCw className="h-4 w-4" />
        Riprova
      </button>
    </div>
  );
}

function ProfileHero({
  profile,
  isOwnProfile,
  isAuthenticated,
}: {
  profile: PublicUserProfile;
  isOwnProfile: boolean;
  isAuthenticated: boolean;
}) {
  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
      <UserAvatar
        username={profile.username}
        avatar_url={profile.avatar_url}
        size="lg"
        className="mx-auto sm:mx-0"
      />

      <div className="flex-1 text-center sm:text-left">
        <div className="mb-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
          <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            @{profile.username}
          </h1>
          <AccountTypeBadge type={profile.account_type} />
          {profile.is_verified_seller && (
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
              <CheckCircle className="h-3 w-3" />
              Venditore Verificato
            </span>
          )}
        </div>

        {profile.country_code && (
          <p className="mb-2 text-sm font-medium text-slate-500">{profile.country_code}</p>
        )}

        {profile.bio && (
          <p className="mb-3 line-clamp-2 text-sm leading-relaxed text-slate-600">{profile.bio}</p>
        )}

        <div className="mb-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 sm:justify-start">
          {profile.member_since && (
            <span className="text-xs font-medium text-slate-500">
              Membro da{' '}
              <span className="font-semibold text-slate-700">
                {formatMemberSince(profile.member_since)}
              </span>
            </span>
          )}
          <FeedbackScore score_pct={profile.feedback_score_pct} count={profile.feedback_count} />
        </div>

        {isAuthenticated && !isOwnProfile && (
          <Link
            href="/account/messaggi"
            className="inline-flex items-center gap-2 rounded-full bg-[#ff7300] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#e56a00]"
          >
            <MessageCircle className="h-4 w-4" />
            Invia messaggio
          </Link>
        )}
      </div>
    </div>
  );
}

export function UserProfileClient({ username }: UserProfileClientProps) {
  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [activeTab, setActiveTab] = useState<ProfileTab>('collezione');

  const currentUser = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const isOwnProfile =
    isAuthenticated && currentUser?.name?.toLowerCase() === username.toLowerCase();

  const loadProfile = async () => {
    setIsLoading(true);
    setIsNotFound(false);
    setHasError(false);

    try {
      const response = await authApi.get<PublicUserProfileResponse>(
        `/api/auth/users/${username}`
      );
      setProfile(response?.data ?? null);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 404) {
        setIsNotFound(true);
      } else {
        setHasError(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  return (
    <main className="min-h-screen bg-slate-50 font-sans selection:bg-[#ff7300]/20">
      <Suspense fallback={<div className="h-[120px] bg-[#1D3160]" />}>
        <Header />
      </Suspense>

      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] left-[20%] h-[500px] w-[500px] rounded-full bg-[#ff7300]/5 blur-[100px]" />
        <div className="absolute right-[10%] top-[30%] h-[400px] w-[400px] rounded-full bg-blue-500/5 blur-[120px]" />
      </div>

      <div className="relative z-10">
        <div className="container-content pb-24 pt-10 lg:pb-32 lg:pt-14">
          <div className="mx-auto max-w-3xl">
            {isLoading && <HeroSkeleton />}
            {!isLoading && isNotFound && <NotFoundState username={username} />}
            {!isLoading && hasError && <ErrorState onRetry={loadProfile} />}
            {!isLoading && profile && (
              <div className="space-y-8">
                <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-900/5 sm:p-8">
                  <ProfileHero
                    profile={profile}
                    isOwnProfile={isOwnProfile}
                    isAuthenticated={isAuthenticated}
                  />
                </div>

                <UserProfileTabs
                  username={profile.username}
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
