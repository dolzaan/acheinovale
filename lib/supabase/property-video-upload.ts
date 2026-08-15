"use client";

import { Upload } from "tus-js-client";
import { propertyVideoUploadEndpoint, STORAGE_BUCKETS } from "@/lib/supabase/storage";

export function uploadPropertyVideo(file: File, storageKey: string, accessToken: string, onProgress: (percentage: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const upload = new Upload(file, {
      endpoint: propertyVideoUploadEndpoint(),
      retryDelays: [0, 3000, 5000, 10000, 20000],
      headers: { authorization: `Bearer ${accessToken}` },
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      chunkSize: 6 * 1024 * 1024,
      metadata: {
        bucketName: STORAGE_BUCKETS.properties,
        objectName: storageKey,
        contentType: file.type,
        cacheControl: "31536000",
      },
      onError: reject,
      onProgress: (uploaded, total) => onProgress(Math.round((uploaded / total) * 100)),
      onSuccess: () => resolve(),
    });

    upload.findPreviousUploads()
      .then(previousUploads => {
        if (previousUploads.length) upload.resumeFromPreviousUpload(previousUploads[0]);
        upload.start();
      })
      .catch(reject);
  });
}
