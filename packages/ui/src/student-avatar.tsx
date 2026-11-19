import { cn } from './lib/utils';

export function StudentAvatar({
  name,
  photoUrl,
  className,
}: {
  name: string;
  photoUrl?: string | null;
  className?: string;
}) {
  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={name}
        className={cn('h-12 w-12 rounded-full object-cover', className)}
      />
    );
  }
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .slice(-2)
    .join('')
    .toUpperCase();
  return (
    <span
      className={cn(
        'flex h-12 w-12 items-center justify-center rounded-full bg-accent font-semibold text-accent-foreground',
        className,
      )}
    >
      {initials}
    </span>
  );
}
