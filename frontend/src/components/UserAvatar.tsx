import type { CSSProperties } from "react";
import type { User } from "../types/user";
import "./UserAvatar.css";

const API_BASE_URL = "http://localhost:5000";

type AvatarUser = Pick<User, "firstName" | "lastName" | "profilePhotoUrl">;

type UserAvatarProps = {
  user?: AvatarUser | null;
  alt?: string;
  size?: "default" | "large";
  pixelSize?: number;
  showOnline?: boolean;
  isOnline?: boolean;
  avatarClassName?: string;
  wrapperClassName?: string;
  onlineDotClassName?: string;
};

const getImageUrl = (photoUrl?: string | null) => {
  if (!photoUrl) return null;
  if (photoUrl.startsWith("http://") || photoUrl.startsWith("https://")) {
    return photoUrl;
  }
  return `${API_BASE_URL}${photoUrl}`;
};

const getInitials = (user?: AvatarUser | null) => {
  return `${user?.firstName?.charAt(0) || ""}${user?.lastName?.charAt(0) || ""}`;
};

export default function UserAvatar({
  user,
  alt = "Profile",
  size = "default",
  pixelSize,
  showOnline = false,
  isOnline = false,
  avatarClassName,
  wrapperClassName,
  onlineDotClassName,
}: UserAvatarProps) {
  const imageUrl = getImageUrl(user?.profilePhotoUrl);
  const initials = getInitials(user);

  const avatarClasses = [
    avatarClassName || (size === "large" ? "profile-avatar large" : "user-avatar"),
  ]
    .filter(Boolean)
    .join(" ");

  const wrapperClasses = ["user-avatar-wrapper", wrapperClassName]
    .filter(Boolean)
    .join(" ");

  const onlineDotClasses = [
    "online-dot",
    size === "large" ? "large-dot" : "",
    onlineDotClassName,
  ]
    .filter(Boolean)
    .join(" ");

  const inlineSizeStyle: CSSProperties | undefined = pixelSize
    ? {
        width: pixelSize,
        height: pixelSize,
        minWidth: pixelSize,
        fontSize: Math.max(18, Math.round(pixelSize * 0.3)),
      }
    : undefined;

  return (
    <div className={wrapperClasses}>
      <div className={avatarClasses} style={inlineSizeStyle}>
        {imageUrl ? (
          <img src={imageUrl} alt={alt} className="avatar-image" />
        ) : (
          initials || "?"
        )}
      </div>
      {showOnline && isOnline && <span className={onlineDotClasses} />}
    </div>
  );
}
