export function StudentAvatar({ name, photoUrl }: { name: string; photoUrl?: string | null }) {
  if (photoUrl) {
    return <img src={photoUrl} alt={name} className="h-12 w-12 rounded-full object-cover" />;
  }
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .slice(-2)
    .join('')
    .toUpperCase();
  return (
    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-700">
      {initials}
    </span>
  );
}
