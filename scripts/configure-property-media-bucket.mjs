import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;

if (!url || !secretKey) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SECRET_KEY são obrigatórias.");
}

const supabase = createClient(url, secretKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const bucketName = "property-images";
const { data: bucket, error: readError } = await supabase.storage.getBucket(bucketName);

if (readError || !bucket) {
  throw readError || new Error(`Bucket ${bucketName} não encontrado.`);
}

const { error: updateError } = await supabase.storage.updateBucket(bucketName, {
  public: bucket.public,
  fileSizeLimit: 50 * 1024 * 1024,
  allowedMimeTypes: [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/avif",
    "video/mp4",
    "video/webm",
    "video/quicktime",
    "video/x-m4v",
  ],
});

if (updateError) throw updateError;
console.log(`Bucket ${bucketName} preparado para fotos e vídeos.`);
