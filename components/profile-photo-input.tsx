"use client";

import { useEffect, useState } from "react";
import { UserAvatar } from "./user-avatar";

type ProfilePhotoInputProps = {
  image?: string | null;
  name?: string | null;
};

export function ProfilePhotoInput({ image, name }: ProfilePhotoInputProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  return (
    <div className="profile-photo-control">
      <UserAvatar image={preview || image} name={name} size="lg" />
      <div>
        <label className="profile-photo-button" htmlFor="profile-photo">
          Escolher nova foto
        </label>
        <input
          id="profile-photo"
          name="photo"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          onChange={(event) => {
            const file = event.currentTarget.files?.[0];
            setPreview(file ? URL.createObjectURL(file) : null);
            setFileName(file?.name ?? "");
          }}
        />
        <span aria-live="polite">
          {fileName || "JPG, PNG, WebP ou AVIF — máximo de 4 MB."}
        </span>
      </div>
    </div>
  );
}
