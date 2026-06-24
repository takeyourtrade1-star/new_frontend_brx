'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle,
  MapPin,
  MessageCircle,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

import { MissingPage } from '@/components/shared/MissingPage';
import { Header } from '@/components/layout/Header';
import { UserAvatar } from '@/components/feature/users/UserAvatar';
import { FeedbackScore } from '@/components/feature/users/FeedbackScore';
import { UserProfileTabs } from '@/components/feature/users/UserProfileTabs';
import type { ProfileTab } from '@/components/feature/users/UserProfileTabs';
import { authApi } from '@/lib/api/auth-client';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useAuctionList } from '@/lib/hooks/use-auctions';
import { usePublicUserCollection } from '@/lib/hooks/use-public-user-collection';
import type { PublicUserProfile, PublicUserProfileResponse } from '@/types';

interface UserProfileClientProps {
  username: string;
}

function AccountTypeBadge({ type }: { type: 'personal' | 'business' }) {
  if (type === 'business') {
    return (
      <span className="inline-flex items-center rounded-full border border-[#ff7300]/20 bg-[#ff7300]/10 px-2.5 py-0.5 text-xs font-semibold text-[#ff7300] backdrop-blur-sm">
        Business
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full border border-slate-200/80 bg-white/60 px-2.5 py-0.5 text-xs font-semibold text-slate-600 backdrop-blur-sm">
      Privato
    </span>
  );
}

function formatMemberSince(memberSince: string): string {
  const [year, month] = memberSince.split('-');
  if (!year || !month) return memberSince;
  const months = [
    'gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno',
    'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre',
  ];
  const monthIndex = parseInt(month, 10) - 1;
  return `${months[monthIndex] ?? month} ${year}`;
}

function HeroSkeleton() {
  return (
    <div className="animate-pulse space-y-8">
      <div className="rounded-[2rem] border border-white/60 bg-white/50 p-8 backdrop-blur-xl">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          <div className="h-28 w-28 shrink-0 rounded-full bg-slate-200/80" />
          <div className="w-full flex-1 space-y-4">
            <div className="mx-auto h-9 w-48 rounded-xl bg-slate-200/80 sm:mx-0" />
            <div className="mx-auto h-4 w-64 rounded bg-slate-200/60 sm:mx-0" />
            <div className="mx-auto h-16 w-full max-w-md rounded-xl bg-slate-100/80 sm:mx-0" />
          </div>
        </div>
      </div>
      <div className="h-12 rounded-2xl bg-white/40" />
      <div className="h-64 rounded-3xl bg-white/40" />
    </div>
  );
}

function NotFoundState({ username }: { username: string }) {
  return (
    <MissingPage
      className="min-h-0 py-8"
      title="Utente non trovato"
      description={
        <>
          <p className="max-w-sm leading-relaxed">
            L&apos;utente{' '}
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              @{username}
            </span>{' '}
            non esiste o non è più disponibile.
          </p>
        </>
      }
      actions={
        <Link
          href="/search/user"
          className="inline-flex items-center gap-2 rounded-full bg-[#ff7300] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#ff7300]/25 transition hover:bg-[#e56a00]"
        >
          <ArrowLeft className="h-4 w-4" />
          Cerca altri utenti
        </Link>
      }
    />
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <MissingPage
      className="min-h-0 py-8"
      title="Errore di caricamento"
      description="Impossibile caricare il profilo. Controlla la connessione e riprova."
      actions={
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
        >
          <RefreshCw className="h-4 w-4" />
          Riprova
        </button>
      }
    />
  );
}

function ProfileHero({
  profile,
  isOwnProfile,
  isAuthenticated,
  collectionCount,
  auctionsCount,
}: {
  profile: PublicUserProfile;
  isOwnProfile: boolean;
  isAuthenticated: boolean;
  collectionCount: number | null;
  auctionsCount: number | null;
}) {
  const stats = [
    collectionCount != null && collectionCount > 0
      ? { label: 'Collezione', value: String(collectionCount) }
      : null,
    auctionsCount != null && auctionsCount > 0
      ? { label: 'Aste', value: String(auctionsCount) }
      : null,
    (profile.feedback_count ?? 0) > 0
      ? { label: 'Feedback', value: String(profile.feedback_count ?? 0) }
      : null,
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/60 shadow-[0_20px_60px_rgba(15,23,42,0.07)] backdrop-blur-2xl">
      <div
        className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[#ff7300]/8 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-[#3D65C6]/8 blur-3xl"
        aria-hidden
      />

      <div className="relative flex flex-col gap-8 p-6 sm:p-8 lg:flex-row lg:items-start">
        <div className="flex shrink-0 justify-center lg:justify-start">
          <div className="relative">
            <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-[#ff7300]/30 via-transparent to-[#3D65C6]/20 blur-sm" />
            <UserAvatar
              username={profile.username}
              avatar_url={profile.avatar_url}
              size="lg"
              className="relative ring-4 ring-white/90 shadow-xl"
            />
          </div>
        </div>

        <div className="min-w-0 flex-1 text-center lg:text-left">
          <div className="mb-3 flex flex-wrap items-center justify-center gap-2 lg:justify-start">
            <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
              @{profile.username}
            </h1>
            <AccountTypeBadge type={profile.account_type} />
            {profile.is_verified_seller && (
              <span className="inline-flex items-center gap-1 rounded-full border border-blue-200/80 bg-blue-50/90 px-2.5 py-0.5 text-xs font-semibold text-blue-700 backdrop-blur-sm">
                <CheckCircle className="h-3 w-3" />
                Verificato
              </span>
            )}
          </div>

          {profile.country_code && (
            <p className="mb-3 inline-flex items-center justify-center gap-1.5 text-sm font-medium text-slate-500 lg:justify-start">
              <MapPin className="h-3.5 w-3.5 text-slate-400" />
              {profile.country_code}
            </p>
          )}

          {profile.bio ? (
            <p className="mx-auto mb-5 max-w-2xl text-sm leading-relaxed text-slate-600 lg:mx-0 lg:text-base">
              {profile.bio}
            </p>
          ) : (
            <p className="mb-5 text-sm italic text-slate-400">Nessuna bio ancora.</p>
          )}

          <div className="mb-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 lg:justify-start">
            {profile.member_since && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
                <Sparkles className="h-3.5 w-3.5 text-[#ff7300]" />
                Membro da{' '}
                <span className="font-semibold text-slate-700">
                  {formatMemberSince(profile.member_since)}
                </span>
              </span>
            )}
            <FeedbackScore score_pct={profile.feedback_score_pct} count={profile.feedback_count} />
          </div>

          {stats.length > 0 && (
            <div className="mb-6 flex flex-wrap justify-center gap-3 lg:justify-start">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="min-w-[5.5rem] rounded-2xl border border-white/80 bg-white/50 px-4 py-3 text-center shadow-sm backdrop-blur-md"
                >
                  <p className="text-lg font-black tabular-nums text-slate-900">{stat.value}</p>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          )}

          {isAuthenticated && !isOwnProfile && (
            <Link
              href="/account/messaggi"
              className="inline-flex items-center gap-2 rounded-full bg-[#ff7300] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#ff7300]/20 transition hover:bg-[#e56a00] hover:shadow-[#ff7300]/30"
            >
              <MessageCircle className="h-4 w-4" />
              Invia messaggio
            </Link>
          )}

          {isOwnProfile && (
            <Link
              href="/account/oggetti"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-white"
            >
              Gestisci la mia collezione
            </Link>
          )}
        </div>
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
    isAuthenticated &&
    (currentUser?.id === profile?.id ||
      currentUser?.name?.toLowerCase() === username.toLowerCase());

  const loadProfile = async () => {
    setIsLoading(true);
    setIsNotFound(false);
    setHasError(false);

    try {
      const response = await authApi.get<PublicUserProfileResponse>(
        `/api/auth/users/${encodeURIComponent(username)}`,
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

  const profileLoaded = Boolean(profile?.id);
  const { data: collectionPreview } = usePublicUserCollection(
    username,
    { limit: 1, offset: 0 },
    profileLoaded,
  );
  const { data: auctionsPreview } = useAuctionList(
    { created_by_user_id: profile?.id, limit: 1, offset: 0 },
    { enabled: profileLoaded },
  );

  const collectionCount = collectionPreview?.total ?? null;
  const auctionsCount = auctionsPreview?.total ?? null;

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-50/95 to-slate-100/80 font-sans selection:bg-[#ff7300]/20">
      <Suspense fallback={<div className="h-[120px] bg-[#1D3160]" />}>
        <Header />
      </Suspense>

      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-[8%] left-[15%] h-[520px] w-[520px] rounded-full bg-[#ff7300]/6 blur-[120px]" />
        <div className="absolute right-[5%] top-[25%] h-[420px] w-[420px] rounded-full bg-[#3D65C6]/6 blur-[100px]" />
        <div className="absolute bottom-[10%] left-[40%] h-[300px] w-[300px] rounded-full bg-[#ff7300]/4 blur-[90px]" />
      </div>

      <div className="relative z-10">
        <div className="container-content pb-28 pt-8 lg:pb-36 lg:pt-12">
          <div className="mb-6">
            <Link
              href="/search/user"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-[#ff7300]"
            >
              <ArrowLeft className="h-4 w-4" />
              Ricerca utente
            </Link>
          </div>

          <div className="mx-auto max-w-5xl">
            {isLoading && <HeroSkeleton />}
            {!isLoading && isNotFound && <NotFoundState username={username} />}
            {!isLoading && hasError && <ErrorState onRetry={loadProfile} />}
            {!isLoading && profile && (
              <div className="space-y-8">
                <ProfileHero
                  profile={profile}
                  isOwnProfile={isOwnProfile}
                  isAuthenticated={isAuthenticated}
                  collectionCount={collectionCount}
                  auctionsCount={auctionsCount}
                />

                <UserProfileTabs
                  userId={profile.id}
                  username={profile.username}
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                  collectionCount={collectionCount}
                  auctionsCount={auctionsCount}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
