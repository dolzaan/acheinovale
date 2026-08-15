"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { Upload } from "tus-js-client";
import { createProperty } from "@/app/publicar/imovel/actions";
import { MoneyInput } from "@/components/money-input";
import { PhoneInput } from "@/components/phone-input";
import { createClient } from "@/lib/supabase/client";
import {
  createPropertyImagePath,
  createPropertyVideoPath,
  PROPERTY_IMAGE_LIMIT,
  PROPERTY_IMAGE_MAX_BYTES,
  PROPERTY_IMAGE_MIME_TYPES,
  PROPERTY_VIDEO_MAX_BYTES,
  PROPERTY_VIDEO_MIME_TYPES,
  propertyVideoUploadEndpoint,
  STORAGE_BUCKETS,
} from "@/lib/supabase/storage";

type CityOption = {
  id: string;
  name: string;
  stateCode: string;
  neighborhoods: Array<{ id: string; name: string }>;
};

type SelectedMedia = { id: string; file: File; preview: string };

function uploadVideo(file: File, storageKey: string, accessToken: string, onProgress: (percentage: number) => void) {
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

export function PropertyPublishForm({ authUserId, cityId, phone, cities }: { authUserId: string; cityId: string; phone: string; cities: CityOption[] }) {
  const [photos, setPhotos] = useState<SelectedMedia[]>([]);
  const [video, setVideo] = useState<SelectedMedia | null>(null);
  const [uploading, setUploading] = useState(false);
  const [photoProgress, setPhotoProgress] = useState(0);
  const [videoProgress, setVideoProgress] = useState(0);
  const [mediaError, setMediaError] = useState("");
  const photosRef = useRef(photos);
  const videoRef = useRef(video);
  const imageKeysRef = useRef<HTMLInputElement>(null);
  const videoKeyRef = useRef<HTMLInputElement>(null);
  const readyToSubmit = useRef(false);

  useEffect(() => { photosRef.current = photos; }, [photos]);
  useEffect(() => { videoRef.current = video; }, [video]);
  useEffect(() => () => {
    photosRef.current.forEach(photo => URL.revokeObjectURL(photo.preview));
    if (videoRef.current) URL.revokeObjectURL(videoRef.current.preview);
  }, []);

  function selectPhotos(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.currentTarget.files ?? []);
    event.currentTarget.value = "";
    setMediaError("");
    if (!selected.length) return;
    if (photos.length + selected.length > PROPERTY_IMAGE_LIMIT) {
      setMediaError(`Você pode adicionar no máximo ${PROPERTY_IMAGE_LIMIT} fotos.`);
      return;
    }
    const invalidType = selected.find(file => !PROPERTY_IMAGE_MIME_TYPES.includes(file.type as (typeof PROPERTY_IMAGE_MIME_TYPES)[number]));
    if (invalidType) {
      setMediaError("Use apenas imagens JPG, PNG, WebP ou AVIF.");
      return;
    }
    const oversized = selected.find(file => file.size > PROPERTY_IMAGE_MAX_BYTES);
    if (oversized) {
      setMediaError(`A foto “${oversized.name}” ultrapassa o limite de 6 MB.`);
      return;
    }
    setPhotos(current => [...current, ...selected.map(file => ({ id: crypto.randomUUID(), file, preview: URL.createObjectURL(file) }))]);
  }

  function selectVideo(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    setMediaError("");
    if (!file) return;
    if (!PROPERTY_VIDEO_MIME_TYPES.includes(file.type as (typeof PROPERTY_VIDEO_MIME_TYPES)[number])) {
      setMediaError("Use um vídeo MP4, WebM, MOV ou M4V.");
      return;
    }
    if (file.size > PROPERTY_VIDEO_MAX_BYTES) {
      setMediaError(`O vídeo “${file.name}” ultrapassa o limite de 50 MB.`);
      return;
    }
    setVideo(current => {
      if (current) URL.revokeObjectURL(current.preview);
      return { id: crypto.randomUUID(), file, preview: URL.createObjectURL(file) };
    });
  }

  function removePhoto(id: string) {
    setPhotos(current => {
      const removed = current.find(photo => photo.id === id);
      if (removed) URL.revokeObjectURL(removed.preview);
      return current.filter(photo => photo.id !== id);
    });
  }

  function removeVideo() {
    setVideo(current => {
      if (current) URL.revokeObjectURL(current.preview);
      return null;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (readyToSubmit.current) return;
    event.preventDefault();
    setMediaError("");

    if (!photos.length && !video) {
      readyToSubmit.current = true;
      event.currentTarget.requestSubmit();
      return;
    }

    setUploading(true);
    setPhotoProgress(0);
    setVideoProgress(0);
    const form = event.currentTarget;
    const supabase = createClient();
    const uploadedKeys: string[] = [];

    try {
      const [{ data: auth, error: authError }, { data: sessionData }] = await Promise.all([
        supabase.auth.getUser(),
        supabase.auth.getSession(),
      ]);
      if (authError || auth.user?.id !== authUserId || !sessionData.session?.access_token) {
        throw new Error("Sua sessão expirou. Entre novamente.");
      }

      const imageResults = await Promise.all(photos.map(async photo => {
        const storageKey = createPropertyImagePath(authUserId, photo.file.type);
        const { error } = await supabase.storage.from(STORAGE_BUCKETS.properties).upload(storageKey, photo.file, {
          contentType: photo.file.type,
          cacheControl: "31536000",
          upsert: false,
        });
        setPhotoProgress(current => current + 1);
        return { storageKey, error };
      }));

      const failedPhoto = imageResults.find(result => result.error);
      uploadedKeys.push(...imageResults.filter(result => !result.error).map(result => result.storageKey));
      if (failedPhoto) throw new Error(failedPhoto.error?.message || "Não foi possível enviar as fotos.");

      let uploadedVideoKey = "";
      if (video) {
        uploadedVideoKey = createPropertyVideoPath(authUserId, video.file.type);
        await uploadVideo(video.file, uploadedVideoKey, sessionData.session.access_token, setVideoProgress);
        uploadedKeys.push(uploadedVideoKey);
      }

      if (imageKeysRef.current) imageKeysRef.current.value = JSON.stringify(imageResults.map(result => result.storageKey));
      if (videoKeyRef.current) videoKeyRef.current.value = uploadedVideoKey;
      readyToSubmit.current = true;
      form.requestSubmit();
    } catch (error) {
      if (uploadedKeys.length) await supabase.storage.from(STORAGE_BUCKETS.properties).remove(uploadedKeys);
      setUploading(false);
      setMediaError(error instanceof Error ? error.message : "Não foi possível enviar as mídias. Tente novamente.");
    }
  }

  const progressLabel = video && photoProgress >= photos.length
    ? `Enviando vídeo ${videoProgress}%...`
    : `Enviando fotos ${photoProgress}/${photos.length}...`;

  return (
    <form className="listing-form" action={createProperty} onSubmit={handleSubmit}>
      <input ref={imageKeysRef} type="hidden" name="imageKeys" defaultValue="[]" />
      <input ref={videoKeyRef} type="hidden" name="videoKey" defaultValue="" />
      <label className="field-wide"><span>Título</span><input name="title" minLength={8} maxLength={120} placeholder="Ex: Casa com 3 quartos no Centro" required /></label>
      <label><span>Finalidade</span><select name="purpose" required><option value="RENT">Aluguel</option><option value="SALE">Venda</option></select></label>
      <label><span>Tipo</span><select name="type" required><option value="HOUSE">Casa</option><option value="APARTMENT">Apartamento</option><option value="STUDIO">Kitnet / Studio</option><option value="LAND">Terreno</option><option value="COMMERCIAL_ROOM">Sala comercial</option><option value="WAREHOUSE">Galpão</option><option value="OTHER">Outro</option></select></label>
      <label><span>Cidade</span><select name="cityId" defaultValue={cityId} required>{cities.map(city => <option key={city.id} value={city.id}>{city.name} — {city.stateCode}</option>)}</select></label>
      <label><span>Bairro</span><select name="neighborhoodId" required><option value="">Selecione</option>{cities.flatMap(city => city.neighborhoods.map(neighborhood => <option key={neighborhood.id} value={neighborhood.id}>{neighborhood.name} — {city.name}</option>))}</select></label>
      <label><span>Preço</span><MoneyInput /></label>
      <label><span>WhatsApp do anúncio</span><PhoneInput name="whatsapp" defaultValue={phone} /></label>
      <label><span>Quartos</span><input name="bedrooms" type="number" min="0" max="30" /></label>
      <label><span>Banheiros</span><input name="bathrooms" type="number" min="0" max="30" /></label>
      <label><span>Vagas</span><input name="parkingSpots" type="number" min="0" max="30" /></label>
      <label className="field-wide"><span>Descrição</span><textarea name="description" minLength={30} maxLength={3000} rows={7} placeholder="Conte os principais detalhes do imóvel..." required /></label>

      <section className="property-photo-field field-wide" aria-labelledby="property-photo-title">
        <div className="property-photo-field__heading"><div><strong id="property-photo-title">Fotos do imóvel</strong><span>A primeira foto será a capa do anúncio.</span></div><b>{photos.length}/{PROPERTY_IMAGE_LIMIT}</b></div>
        <label className="property-photo-picker" htmlFor="property-photos"><span>Adicionar fotos</span><small>JPG, PNG, WebP ou AVIF · até 6 MB cada</small></label>
        <input id="property-photos" className="property-photo-input" type="file" accept={PROPERTY_IMAGE_MIME_TYPES.join(",")} multiple onChange={selectPhotos} disabled={uploading || photos.length >= PROPERTY_IMAGE_LIMIT} />
        {photos.length ? <div className="property-photo-previews">{photos.map((photo, index) => <div className="property-photo-preview" key={photo.id}><Image src={photo.preview} alt={`Prévia da foto ${index + 1}`} fill sizes="(max-width: 680px) 45vw, 150px" unoptimized />{index === 0 ? <span>Capa</span> : null}<button type="button" onClick={() => removePhoto(photo.id)} disabled={uploading} aria-label={`Remover foto ${index + 1}`}>×</button></div>)}</div> : <p className="property-photo-empty">Você pode publicar sem fotos, mas anúncios com boas imagens costumam receber mais contatos.</p>}
      </section>

      <section className="property-photo-field property-video-field field-wide" aria-labelledby="property-video-title">
        <div className="property-photo-field__heading"><div><strong id="property-video-title">Vídeo do imóvel</strong><span>Mostre os ambientes em um passeio rápido.</span></div><b>{video ? "1/1" : "0/1"}</b></div>
        {!video ? <><label className="property-photo-picker" htmlFor="property-video"><span>Adicionar vídeo</span><small>MP4, WebM, MOV ou M4V · até 50 MB</small></label><input id="property-video" className="property-photo-input" type="file" accept={PROPERTY_VIDEO_MIME_TYPES.join(",")} onChange={selectVideo} disabled={uploading} /></> : <div className="property-video-preview"><video src={video.preview} controls playsInline preload="metadata" /><button type="button" onClick={removeVideo} disabled={uploading}>Remover vídeo</button></div>}
      </section>

      {mediaError ? <p className="property-photo-error field-wide" role="alert">{mediaError}</p> : null}
      <button className="button button--primary field-wide" type="submit" disabled={uploading}>{uploading ? progressLabel : "Enviar para análise"}</button>
    </form>
  );
}
