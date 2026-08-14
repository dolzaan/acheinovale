type UserAvatarProps = {
  image?: string | null;
  name?: string | null;
  size?: "sm" | "lg";
};

export function UserAvatar({ image, name, size = "sm" }: UserAvatarProps) {
  const initials = (name || "Usuário")
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <span className={`user-avatar user-avatar--${size}`} aria-hidden="true">
      {image ? (
        // A imagem é fornecida pelo provedor OAuth e validada pelo Supabase.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" referrerPolicy="no-referrer" />
      ) : (
        initials
      )}
    </span>
  );
}
