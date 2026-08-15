"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createProfileImagePath,
  isSupportedProfileImage,
  PROFILE_IMAGE_MAX_BYTES,
  PROFILE_IMAGE_MIME_TYPES,
  profileImagePathFromPublicUrl,
  STORAGE_BUCKETS,
} from "@/lib/supabase/storage";
import { normalizeBrazilianPhone, safeInternalPath } from "@/lib/validation/profile";

function value(formData: FormData, key: string) {
  const field = formData.get(key);
  return typeof field === "string" ? field.trim() : "";
}

export async function updateProfile(formData: FormData) {
  const user = await requireCurrentUser("/perfil");
  const name = value(formData, "name");
  const cityId = value(formData, "cityId");
  const phone = normalizeBrazilianPhone(value(formData, "phone"));
  const next = safeInternalPath(value(formData, "next"), "/perfil?salvo=1");
  const photoField = formData.get("photo");
  const photo = photoField instanceof File && photoField.size > 0 ? photoField : null;

  if (!user.authUserId) {
    redirect("/entrar?next=%2Fperfil");
  }

  if (name.length < 2 || name.length > 100 || !phone || !cityId) {
    redirect(`/perfil?erro=dados&next=${encodeURIComponent(next)}`);
  }

  const city = await prisma.city.findFirst({ where: { id: cityId, isActive: true }, select: { id: true } });
  if (!city) redirect(`/perfil?erro=cidade&next=${encodeURIComponent(next)}`);

  let newImage: string | undefined;
  let uploadedPath: string | null = null;
  let admin: ReturnType<typeof createAdminClient> | null = null;

  if (photo) {
    if (photo.size > PROFILE_IMAGE_MAX_BYTES) {
      redirect(`/perfil?erro=foto-tamanho&next=${encodeURIComponent(next)}`);
    }

    const bytes = new Uint8Array(await photo.arrayBuffer());
    if (!isSupportedProfileImage(bytes, photo.type)) {
      redirect(`/perfil?erro=foto-tipo&next=${encodeURIComponent(next)}`);
    }

    try {
      admin = createAdminClient();
      const { data: bucket } = await admin.storage.getBucket(STORAGE_BUCKETS.profiles);

      if (!bucket) {
        const { error: bucketError } = await admin.storage.createBucket(
          STORAGE_BUCKETS.profiles,
          {
            public: true,
            fileSizeLimit: PROFILE_IMAGE_MAX_BYTES,
            allowedMimeTypes: [...PROFILE_IMAGE_MIME_TYPES],
          },
        );

        if (bucketError && !bucketError.message.toLowerCase().includes("already")) {
          throw bucketError;
        }
      } else {
        const { error: bucketError } = await admin.storage.updateBucket(
          STORAGE_BUCKETS.profiles,
          {
            public: true,
            fileSizeLimit: PROFILE_IMAGE_MAX_BYTES,
            allowedMimeTypes: [...PROFILE_IMAGE_MIME_TYPES],
          },
        );
        if (bucketError) throw bucketError;
      }

      uploadedPath = createProfileImagePath(user.authUserId, photo.type);
      const { error: uploadError } = await admin.storage
        .from(STORAGE_BUCKETS.profiles)
        .upload(uploadedPath, bytes, {
          contentType: photo.type,
          cacheControl: "31536000",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      newImage = admin.storage
        .from(STORAGE_BUCKETS.profiles)
        .getPublicUrl(uploadedPath).data.publicUrl;
    } catch (error) {
      console.error("[perfil] Falha ao enviar foto de perfil.", {
        message: error instanceof Error ? error.message : String(error),
      });
      redirect(`/perfil?erro=foto-upload&next=${encodeURIComponent(next)}`);
    }
  }

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: { name, phone, cityId: city.id, ...(newImage ? { image: newImage } : {}) },
    });
  } catch (error) {
    if (admin && uploadedPath) {
      await admin.storage.from(STORAGE_BUCKETS.profiles).remove([uploadedPath]);
    }
    throw error;
  }

  const previousImagePath = profileImagePathFromPublicUrl(user.image);
  if (
    admin &&
    previousImagePath?.startsWith(`${user.authUserId}/profile/`) &&
    previousImagePath !== uploadedPath
  ) {
    const { error } = await admin.storage
      .from(STORAGE_BUCKETS.profiles)
      .remove([previousImagePath]);
    if (error) {
      console.warn("[perfil] Não foi possível remover a foto anterior.", {
        message: error.message,
      });
    }
  }

  revalidatePath("/perfil");
  revalidatePath("/");
  revalidatePath("/meus-anuncios");
  redirect(next === "/perfil" ? "/perfil?salvo=1" : next);
}
