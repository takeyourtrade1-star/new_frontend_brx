import type { Metadata } from 'next';

import { UserProfileClient } from './UserProfileClient';

interface PageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;

  let bio: string | null = null;
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_API_URL ?? process.env.API_BASE_URL ?? '';
    const res = await fetch(`${baseUrl}/api/auth/users/${username}`, {
      next: { revalidate: 60 },
    });
    if (res.ok) {
      const json = (await res.json()) as { data?: { bio?: string | null } };
      bio = json?.data?.bio ?? null;
    }
  } catch {
    // Fallback to default description if fetch fails
  }

  return {
    title: `@${username} · Profilo | Ebartex`,
    description:
      bio ?? `Visualizza il profilo di ${username} su Ebartex: collezione, aste, scambi e recensioni.`,
  };
}

export default async function UserProfilePage({ params }: PageProps) {
  const { username } = await params;
  return <UserProfileClient username={username} />;
}
