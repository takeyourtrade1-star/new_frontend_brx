import type { Metadata } from 'next';

import { fetchPublicProfileBio } from '@/lib/user-profile-metadata';
import { UserProfileClient } from './UserProfileClient';

interface PageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  const safeUsername = /^[A-Za-z0-9_.-]{1,50}$/.test(username)
    ? username
    : 'utente';
  const bio = await fetchPublicProfileBio(username);

  return {
    title: `@${safeUsername} · Profilo | Ebartex`,
    description:
      bio ?? `Visualizza il profilo di ${safeUsername} su Ebartex: collezione, aste, scambi e recensioni.`,
  };
}

export default async function UserProfilePage({ params }: PageProps) {
  const { username } = await params;
  return <UserProfileClient username={username} />;
}
