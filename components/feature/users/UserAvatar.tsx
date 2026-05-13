import Image from 'next/image';

type AvatarSize = 'sm' | 'md' | 'lg';

const SIZE_MAP: Record<AvatarSize, { container: string; text: string; px: number }> = {
  sm: { container: 'h-8 w-8', text: 'text-sm', px: 32 },
  md: { container: 'h-12 w-12', text: 'text-base', px: 48 },
  lg: { container: 'h-24 w-24', text: 'text-3xl', px: 96 },
};

interface UserAvatarProps {
  username: string;
  avatar_url: string | null | undefined;
  size?: AvatarSize;
  className?: string;
}

export function UserAvatar({ username, avatar_url, size = 'md', className = '' }: UserAvatarProps) {
  const { container, text, px } = SIZE_MAP[size];
  const initial = username.charAt(0).toUpperCase();

  return (
    <div
      className={`${container} relative shrink-0 overflow-hidden rounded-full bg-slate-200 ring-2 ring-white ${className}`}
    >
      {avatar_url ? (
        <Image
          src={avatar_url}
          alt={`Avatar di ${username}`}
          width={px}
          height={px}
          className="h-full w-full object-cover"
        />
      ) : (
        <span
          className={`flex h-full w-full items-center justify-center font-bold text-slate-600 ${text}`}
          aria-hidden="true"
        >
          {initial}
        </span>
      )}
    </div>
  );
}
