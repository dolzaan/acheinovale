"use client";

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { createProperty } from "@/app/publicar/imovel/actions";
import { MoneyInput } from "@/components/money-input";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { PhoneInput } from "@/components/phone-input";
import { PropertyMediaOrganizer, type PropertyOrganizerItem } from "@/components/property-media-organizer";
import { createClient } from "@/lib/supabase/client";
import { uploadPropertyVideo } from "@/lib/supabase/property-video-upload";
import {
  createPropertyImagePath,
  createPropertyVideoPath,
  PROPERTY_IMAGE_LIMIT,
  PROPERTY_IMAGE_MAX_BYTES,
  PROPERTY_IMAGE_MIME_TYPES,
  PROPERTY_VIDEO_MAX_BYTES,
  PROPERTY_VIDEO_MIME_TYPES,
  STORAGE_BUCKETS,
} from "@/lib/supabase/storage";

type CityOption = {
  id: string;
  name: string;
  stateCode: string;
  neighborhoods: Array<{ id: string; name: string }>;
};

type SelectedMedia = { id: string; file: File; preview: string };

export function PropertyPublishForm({ authUserId, cityId, phone, cities }: { authUserId: string; cityId: string; phone: string; cities: CityOption[] }) {
  const [photos, setPhotos] = useState<SelectedMedia[]>([]);
  const [video, setVideo] = useState<SelectedMedia | null>(null);
  const [mediaOrder, setMediaOrder] = useState<string[]>([]);
  const [coverPhotoId, setCoverPhotoId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [photoProgress, setPhotoProgress] = useState(0);
  const [videoProgress, setVideoProgress] = useState(0);
  const [mediaError, setMediaError] = useState("");
  const photosRef = useRef(photos);
  const videoRef = useRef(video);
  const imageKeysRef = useRef<HTMLInputElement>(null);
  const videoKeyRef = useRef<HTMLInputElement>(null);
  const mediaOrderRef = useRef<HTMLInputElement>(null);
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
    const newPhotos = selected.map(file => ({ id: crypto.randomUUID(), file, preview: URL.createObjectURL(file) }));
    setPhotos(current => [...current, ...newPhotos]);
    setMediaOrder(current => {
      const ids = newPhotos.map(photo => photo.id);
      if (!coverPhotoId && ids.length) return [ids[0], ...current, ...ids.slice(1)];
      return [...current, ...ids];
    });
    if (!coverPhotoId && newPhotos.length) setCoverPhotoId(newPhotos[0].id);
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
    const next = { id: crypto.randomUUID(), file, preview: URL.createObjectURL(file) };
    setVideo(current => {
      if (current) URL.revokeObjectURL(current.preview);
      if (current) setMediaOrder(order => order.map(id => id === current.id ? next.id : id));
      else setMediaOrder(order => [...order, next.id]);
      return next;
    });
  }

  function removePhoto(id: string) {
    setPhotos(current => {
      const removed = current.find(photo => photo.id === id);
      if (removed) URL.revokeObjectURL(removed.preview);
      return current.filter(photo => photo.id !== id);
    });
    setMediaOrder(current => current.filter(mediaId => mediaId !== id));
    if (coverPhotoId === id) {
      const nextCover = photos.find(photo => photo.id !== id)?.id ?? null;
      setCoverPhotoId(nextCover);
      if (nextCover) setMediaOrder(current => [nextCover, ...current.filter(mediaId => mediaId !== nextCover)]);
    }
  }

  function removeVideo() {
    setVideo(current => {
      if (current) URL.revokeObjectURL(current.preview);
      if (current) setMediaOrder(order => order.filter(id => id !== current.id));
      return null;
    });
  }

  function reorderMedia(sourceId: string, targetId: string) {
    setMediaOrder(current => {
      const sourceIndex = current.indexOf(sourceId);
      const targetIndex = current.indexOf(targetId);
      if (sourceIndex < 0 || targetIndex < 0) return current;
      const next = [...current];
      next.splice(sourceIndex, 1);
      next.splice(targetIndex, 0, sourceId);
      if (coverPhotoId) return [coverPhotoId, ...next.filter(id => id !== coverPhotoId)];
      return next;
    });
  }

  function moveMedia(id: string, direction: -1 | 1) {
    setMediaOrder(current => {
      const index = current.indexOf(id);
      const targetIndex = index + direction;
      if (index < 0 || targetIndex < 0 || targetIndex >= current.length) return current;
      const next = [...current];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      if (coverPhotoId) return [coverPhotoId, ...next.filter(mediaId => mediaId !== coverPhotoId)];
      return next;
    });
  }

  function setCover(id: string) {
    setCoverPhotoId(id);
    setMediaOrder(current => [id, ...current.filter(mediaId => mediaId !== id)]);
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

      const orderedPhotos = mediaOrder.map(id => photos.find(photo => photo.id === id)).filter((photo): photo is SelectedMedia => Boolean(photo));
      const imageResults = await Promise.all(orderedPhotos.map(async photo => {
        const storageKey = createPropertyImagePath(authUserId, photo.file.type);
        const { error } = await supabase.storage.from(STORAGE_BUCKETS.properties).upload(storageKey, photo.file, {
          contentType: photo.file.type,
          cacheControl: "31536000",
          upsert: false,
        });
        setPhotoProgress(current => current + 1);
        return { id: photo.id, storageKey, error };
      }));

      const failedPhoto = imageResults.find(result => result.error);
      uploadedKeys.push(...imageResults.filter(result => !result.error).map(result => result.storageKey));
      if (failedPhoto) throw new Error(failedPhoto.error?.message || "Não foi possível enviar as fotos.");

      let uploadedVideoKey = "";
      if (video) {
        uploadedVideoKey = createPropertyVideoPath(authUserId, video.file.type);
        await uploadPropertyVideo(video.file, uploadedVideoKey, sessionData.session.access_token, setVideoProgress);
        uploadedKeys.push(uploadedVideoKey);
      }

      if (imageKeysRef.current) imageKeysRef.current.value = JSON.stringify(imageResults.map(result => result.storageKey));
      if (videoKeyRef.current) videoKeyRef.current.value = uploadedVideoKey;
      if (mediaOrderRef.current) {
        const keysById = new Map(imageResults.map(result => [result.id, result.storageKey]));
        if (video && uploadedVideoKey) keysById.set(video.id, uploadedVideoKey);
        mediaOrderRef.current.value = JSON.stringify(mediaOrder.map(id => ({
          kind: video?.id === id ? "video" : "image",
          storageKey: keysById.get(id),
        })));
      }
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

  const mediaItems = mediaOrder.reduce<PropertyOrganizerItem[]>((result, id) => {
    const photo = photos.find(item => item.id === id);
    if (photo) result.push({ id, kind: "image", preview: photo.preview, label: photo.file.name });
    else if (video?.id === id) result.push({ id, kind: "video", preview: video.preview, label: video.file.name });
    return result;
  }, []);

  return (
    <form className="listing-form" action={createProperty} onSubmit={handleSubmit}>
      <input ref={imageKeysRef} type="hidden" name="imageKeys" defaultValue="[]" />
      <input ref={videoKeyRef} type="hidden" name="videoKey" defaultValue="" />
      <input ref={mediaOrderRef} type="hidden" name="mediaOrder" defaultValue="[]" />
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
        {!photos.length ? <p className="property-photo-empty">Você pode publicar sem fotos, mas anúncios com boas imagens costumam receber mais contatos.</p> : null}
      </section>

      <section className="property-photo-field property-video-field field-wide" aria-labelledby="property-video-title">
        <div className="property-photo-field__heading"><div><strong id="property-video-title">Vídeo do imóvel</strong><span>Mostre os ambientes em um passeio rápido.</span></div><b>{video ? "1/1" : "0/1"}</b></div>
        {!video ? <><label className="property-photo-picker" htmlFor="property-video"><span>Adicionar vídeo</span><small>MP4, WebM, MOV ou M4V · até 50 MB</small></label><input id="property-video" className="property-photo-input" type="file" accept={PROPERTY_VIDEO_MIME_TYPES.join(",")} onChange={selectVideo} disabled={uploading} /></> : <p className="property-photo-empty">O vídeo já está junto às fotos abaixo. Você pode mudar a posição ou removê-lo.</p>}
      </section>

      <div className="field-wide">
        <PropertyMediaOrganizer items={mediaItems} coverId={coverPhotoId} disabled={uploading} onMove={moveMedia} onReorder={reorderMedia} onRemove={id => video?.id === id ? removeVideo() : removePhoto(id)} onSetCover={setCover} />
      </div>

      {mediaError ? <p className="property-photo-error field-wide" role="alert">{mediaError}</p> : null}
      <PendingSubmitButton className="button button--primary field-wide" pendingText={uploading ? progressLabel : "Finalizando publicação..."} busy={uploading}>Enviar para análise</PendingSubmitButton>
    </form>
  );
}
