"use client";

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { updatePropertyMedia } from "@/app/meus-anuncios/[id]/midias/actions";
import { PendingSubmitButton } from "@/components/pending-submit-button";
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

type MediaItem = PropertyOrganizerItem & {
  existing: boolean;
  file?: File;
};

export function PropertyMediaEditor({ propertyId, authUserId, initialItems }: { propertyId: string; authUserId: string; initialItems: MediaItem[] }) {
  const [items, setItems] = useState(initialItems);
  const [saving, setSaving] = useState(false);
  const [photoProgress, setPhotoProgress] = useState(0);
  const [videoProgress, setVideoProgress] = useState(0);
  const [error, setError] = useState("");
  const itemsRef = useRef(items);
  const payloadRef = useRef<HTMLInputElement>(null);
  const readyToSubmit = useRef(false);
  const saveAction = updatePropertyMedia.bind(null, propertyId);
  const images = items.filter(item => item.kind === "image");
  const videos = items.filter(item => item.kind === "video");
  const coverId = images[0]?.id ?? null;

  useEffect(() => { itemsRef.current = items; }, [items]);
  useEffect(() => () => {
    itemsRef.current.forEach(item => { if (!item.existing) URL.revokeObjectURL(item.preview); });
  }, []);

  function selectPhotos(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.currentTarget.files ?? []);
    event.currentTarget.value = "";
    setError("");
    if (!files.length) return;
    if (images.length + files.length > PROPERTY_IMAGE_LIMIT) return setError(`Você pode manter no máximo ${PROPERTY_IMAGE_LIMIT} fotos.`);
    if (files.some(file => !PROPERTY_IMAGE_MIME_TYPES.includes(file.type as (typeof PROPERTY_IMAGE_MIME_TYPES)[number]))) return setError("Use apenas imagens JPG, PNG, WebP ou AVIF.");
    const oversized = files.find(file => file.size > PROPERTY_IMAGE_MAX_BYTES);
    if (oversized) return setError(`A foto “${oversized.name}” ultrapassa 6 MB.`);
    const added: MediaItem[] = files.map(file => ({ id: crypto.randomUUID(), kind: "image", preview: URL.createObjectURL(file), label: file.name, existing: false, file }));
    setItems(current => images.length ? [...current, ...added] : [added[0], ...current, ...added.slice(1)]);
  }

  function selectVideo(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    setError("");
    if (!file) return;
    if (videos.length) return setError("Remova o vídeo atual antes de adicionar outro.");
    if (!PROPERTY_VIDEO_MIME_TYPES.includes(file.type as (typeof PROPERTY_VIDEO_MIME_TYPES)[number])) return setError("Use um vídeo MP4, WebM, MOV ou M4V.");
    if (file.size > PROPERTY_VIDEO_MAX_BYTES) return setError(`O vídeo “${file.name}” ultrapassa 50 MB.`);
    setItems(current => [...current, { id: crypto.randomUUID(), kind: "video", preview: URL.createObjectURL(file), label: file.name, existing: false, file }]);
  }

  function removeItem(id: string) {
    setItems(current => {
      const removed = current.find(item => item.id === id);
      if (removed && !removed.existing) URL.revokeObjectURL(removed.preview);
      const next = current.filter(item => item.id !== id);
      const nextCover = next.find(item => item.kind === "image");
      return nextCover ? [nextCover, ...next.filter(item => item.id !== nextCover.id)] : next;
    });
  }

  function reorder(sourceId: string, targetId: string) {
    setItems(current => {
      const source = current.findIndex(item => item.id === sourceId);
      const target = current.findIndex(item => item.id === targetId);
      if (source < 0 || target < 0) return current;
      const next = [...current];
      next.splice(target, 0, next.splice(source, 1)[0]);
      const cover = current.find(item => item.kind === "image")?.id;
      return cover ? [next.find(item => item.id === cover)!, ...next.filter(item => item.id !== cover)] : next;
    });
  }

  function move(id: string, direction: -1 | 1) {
    setItems(current => {
      const index = current.findIndex(item => item.id === id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      const cover = current.find(item => item.kind === "image")?.id;
      return cover ? [next.find(item => item.id === cover)!, ...next.filter(item => item.id !== cover)] : next;
    });
  }

  function setCover(id: string) {
    setItems(current => [current.find(item => item.id === id)!, ...current.filter(item => item.id !== id)]);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (readyToSubmit.current) return;
    event.preventDefault();
    setSaving(true);
    setError("");
    setPhotoProgress(0);
    setVideoProgress(0);
    const form = event.currentTarget;
    const supabase = createClient();
    const uploadedKeys: string[] = [];
    try {
      const [{ data: auth, error: authError }, { data: sessionData }] = await Promise.all([supabase.auth.getUser(), supabase.auth.getSession()]);
      if (authError || auth.user?.id !== authUserId || !sessionData.session?.access_token) throw new Error("Sua sessão expirou. Entre novamente.");

      const uploaded = new Map<string, string>();
      for (const item of items) {
        if (item.existing || !item.file) continue;
        const storageKey = item.kind === "image" ? createPropertyImagePath(authUserId, item.file.type) : createPropertyVideoPath(authUserId, item.file.type);
        if (item.kind === "image") {
          const { error: uploadError } = await supabase.storage.from(STORAGE_BUCKETS.properties).upload(storageKey, item.file, { contentType: item.file.type, cacheControl: "31536000", upsert: false });
          if (uploadError) throw uploadError;
          setPhotoProgress(current => current + 1);
        } else {
          await uploadPropertyVideo(item.file, storageKey, sessionData.session.access_token, setVideoProgress);
        }
        uploaded.set(item.id, storageKey);
        uploadedKeys.push(storageKey);
      }

      if (payloadRef.current) payloadRef.current.value = JSON.stringify(items.map(item => item.existing
        ? { kind: item.kind, id: item.id }
        : { kind: item.kind, storageKey: uploaded.get(item.id) }));
      readyToSubmit.current = true;
      form.requestSubmit();
    } catch (caught) {
      if (uploadedKeys.length) await supabase.storage.from(STORAGE_BUCKETS.properties).remove(uploadedKeys);
      setSaving(false);
      setError(caught instanceof Error ? caught.message : "Não foi possível salvar as mídias.");
    }
  }

  const newPhotos = items.filter(item => !item.existing && item.kind === "image").length;
  const newVideo = items.some(item => !item.existing && item.kind === "video");
  const progress = newVideo && photoProgress >= newPhotos ? `Enviando vídeo ${videoProgress}%...` : `Enviando fotos ${photoProgress}/${newPhotos}...`;

  return (
    <form className="property-media-editor listing-form" action={saveAction} onSubmit={handleSubmit}>
      <input ref={payloadRef} type="hidden" name="mediaOrder" defaultValue="[]" />
      <section className="property-photo-field field-wide">
        <div className="property-photo-field__heading"><div><strong>Fotos do imóvel</strong><span>Escolha a capa e organize a ordem da galeria.</span></div><b>{images.length}/{PROPERTY_IMAGE_LIMIT}</b></div>
        <label className="property-photo-picker" htmlFor="edit-property-photos"><span>Adicionar ou substituir fotos</span><small>JPG, PNG, WebP ou AVIF · até 6 MB cada</small></label>
        <input id="edit-property-photos" className="property-photo-input" type="file" accept={PROPERTY_IMAGE_MIME_TYPES.join(",")} multiple onChange={selectPhotos} disabled={saving || images.length >= PROPERTY_IMAGE_LIMIT} />
      </section>
      <section className="property-photo-field field-wide">
        <div className="property-photo-field__heading"><div><strong>Vídeo do imóvel</strong><span>O vídeo aparece junto às fotos na posição escolhida.</span></div><b>{videos.length}/1</b></div>
        {!videos.length ? <><label className="property-photo-picker" htmlFor="edit-property-video"><span>Adicionar vídeo</span><small>MP4, WebM, MOV ou M4V · até 50 MB</small></label><input id="edit-property-video" className="property-photo-input" type="file" accept={PROPERTY_VIDEO_MIME_TYPES.join(",")} onChange={selectVideo} disabled={saving} /></> : <p className="property-photo-empty">Para substituir, remova o vídeo atual e selecione o novo arquivo.</p>}
      </section>
      <div className="field-wide"><PropertyMediaOrganizer items={items} coverId={coverId} disabled={saving} onMove={move} onReorder={reorder} onRemove={removeItem} onSetCover={setCover} /></div>
      {!items.length ? <p className="property-photo-empty field-wide">O anúncio ficará sem mídias. Você pode adicionar novas fotos agora ou salvar assim mesmo.</p> : null}
      {error ? <p className="property-photo-error field-wide" role="alert">{error}</p> : null}
      <PendingSubmitButton className="button button--primary field-wide" busy={saving} pendingText={saving ? progress : "Salvando..."}>Salvar mídias</PendingSubmitButton>
    </form>
  );
}
