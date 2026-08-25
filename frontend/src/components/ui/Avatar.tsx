interface AvatarProps {
  name: string;
  src?: string | null;
  size?: number;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

export function Avatar({ name, src, size = 32 }: AvatarProps) {
  const style = { width: size, height: size };

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- arbitrary external avatar URL, not a local asset
      <img
        src={src}
        alt={name}
        style={style}
        className="rounded-full object-cover"
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <div
      style={style}
      className="flex items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white"
    >
      {initials(name)}
    </div>
  );
}
