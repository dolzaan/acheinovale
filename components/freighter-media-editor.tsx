"use client";

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { authorizeFreighterImageUploads } from "@/app/media/actions";
import { updateFreighterImages } from "@/app/meus-anuncios/[id]/freteiro-midias/actions";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { PropertyMediaOrganizer, type PropertyOrganizerItem } from "@/components/property-media-organizer";
import { optimizePropertyImages } from "@/lib/images/optimize-property-image";
import { createClient } from "@/lib/supabase/client";
import {
  createFreighterImagePath,
  FREIGHTER_IMAGE_LIMIT,
  PROPERTY_IMAGE_MIME_TYPES,
  PROPERTY_IMAGE_SOURCE_MAX_BYTES,
  STORAGE_BUCKETS,
} from "@/lib/supabase/storage";

type ImageItem = PropertyOrganizerItem & { existing: boolean; file?: File };

export function FreighterMediaEditor({ profileId, authUserId, initialItems }: { profileId: string; authUserId: string; initialItems: ImageItem[] }) {
  const [items, setItems] = useState(initialItems);
  const [optimizing, setOptimizing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const itemsRef = useRef(items);
  const payloadRef = useRef<HTMLInputElement>(null);
  const readyToSubmit = useRef(false);
  const saveAction = updateFreighterImages.bind(null, profileId);

  useEffect(() => { itemsRef.current = items; }, [items]);
  useEffect(() => () => {
    itemsRef.current.forEach(item => { if (!item.existing) URL.revokeObjectURL(item.preview); });
  }, []);

  async function selectPhotos(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.currentTarget.files ?? []);
    event.currentTarget.value = "";
    setError("");
    if (!files.length) return;
    if (items.length + files.length > FREIGHTER_IMAGE_LIMIT) return setError(`Você pode manter no máximo ${FREIGHTER_IMAGE_LIMIT} fotos.`);
    if (files.some(file => !PROPERTY_IMAGE_MIME_TYPES.includes(file.type as (typeof PROPERTY_IMAGE_MIME_TYPES)[number]))) return setError("Use apenas imagens JPG, PNG, WebP ou AVIF.");
    const oversized = files.find(file => file.size > PROPERTY_IMAGE_SOURCE_MAX_BYTES);
    if (oversized) return setError(`A foto “${oversized.name}” ultrapassa 20 MB.`);
    setOptimizing(true);
    try {
      const optimized = await optimizePropertyImages(files);
      const added: ImageItem[] = optimized.map(file => ({ id: crypto.randomUUID(), kind: "image", preview: URL.createObjectURL(file), label: file.name, existing: false, file }));
      setItems(current => [...current, ...added]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível otimizar as fotos.");
    } finally {
      setOptimizing(false);
    }
  }

  function removeItem(id: string) {
    setItems(current => {
      const removed = current.find(item => item.id === id);
      if (removed && !removed.existing) URL.revokeObjectURL(removed.preview);
      return current.filter(item => item.id !== id);
    });
  }

  function reorder(sourceId: string, targetId: string) {
    setItems(current => {
      const source = current.findIndex(item => item.id === sourceId);
      const target = current.findIndex(item => item.id === targetId);
      if (source < 0 || target < 0) return current;
      const next = [...current];
      next.splice(target, 0, next.splice(source, 1)[0]);
      return next;
    });
  }

  function move(id: string, direction: -1 | 1) {
    setItems(current => {
      const index = current.findIndex(item => item.id === id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function setCover(id: string) {
    setItems(current => [current.find(item => item.id === id)!, ...current.filter(item => item.id !== id)]);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (readyToSubmit.current) return;
    event.preventDefault();
    if (optimizing) return setError("Aguarde a otimização das fotos terminar.");
    setSaving(true);
    setError("");
    setProgress(0);
    const form = event.currentTarget;
    const supabase = createClient();
    const uploadedKeys: string[] = [];
    try {
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (authError || auth.user?.id !== authUserId) throw new Error("Sua sessão expirou. Entre novamente.");
      const pending = items.filter((item): item is ImageItem & { file: File } => !item.existing && Boolean(item.file));
      const planned = pending.map(item => ({ item, storageKey: createFreighterImagePath(authUserId, item.file.type) }));
      if (planned.length) {
        const authorization = await authorizeFreighterImageUploads(planned.map(({ item, storageKey }) => ({ storageKey, mimeType: item.file.type, size: item.file.size })));
        if (!authorization.ok) throw new Error(authorization.message);
      }
      const uploaded = new Map<string, string>();
      for (const { item, storageKey } of planned) {
        const { error: uploadError } = await supabase.storage.from(STORAGE_BUCKETS.freighters).upload(storageKey, item.file, { contentType: item.file.type, cacheControl: "31536000", upsert: false });
        if (uploadError) throw uploadError;
        uploaded.set(item.id, storageKey);
        uploadedKeys.push(storageKey);
        setProgress(current => current + 1);
      }
      if (payloadRef.current) payloadRef.current.value = JSON.stringify(items.map(item => item.existing ? { id: item.id } : { storageKey: uploaded.get(item.id) }));
      readyToSubmit.current = true;
      form.requestSubmit();
    } catch (caught) {
      if (uploadedKeys.length) await supabase.storage.from(STORAGE_BUCKETS.freighters).remove(uploadedKeys);
      setSaving(false);
      setError(caught instanceof Error ? caught.message : "Não foi possível salvar as fotos.");
    }
  }

  return (
    <form className="property-media-editor listing-form" action={saveAction} onSubmit={handleSubmit}>
      <input ref={payloadRef} type="hidden" name="imageOrder" defaultValue="[]" />
      <section className="property-photo-field field-wide">
        <div className="property-photo-field__heading"><div><strong>Fotos do serviço</strong><span>A primeira foto será a capa. Arraste para organizar a galeria.</span></div><b>{items.length}/{FREIGHTER_IMAGE_LIMIT}</b></div>
        <label className="property-photo-picker" htmlFor="freighter-photos"><span>{optimizing ? "Otimizando fotos..." : "Adicionar fotos"}</span><small>Até 20 MB por original · conversão automática para WebP</small></label>
        <input id="freighter-photos" className="property-photo-input" type="file" accept={PROPERTY_IMAGE_MIME_TYPES.join(",")} multiple onChange={selectPhotos} disabled={saving || optimizing || items.length >= FREIGHTER_IMAGE_LIMIT} />
      </section>
      <div className="field-wide"><PropertyMediaOrganizer items={items} coverId={items[0]?.id ?? null} disabled={saving || optimizing} onMove={move} onReorder={reorder} onRemove={removeItem} onSetCover={setCover} /></div>
      {!items.length ? <p className="property-photo-empty field-wide">Adicione fotos do veículo e de trabalhos realizados para transmitir mais confiança.</p> : null}
      {error ? <p className="property-photo-error field-wide" role="alert">{error}</p> : null}
      <PendingSubmitButton className="button button--primary field-wide" busy={saving || optimizing} pendingText={optimizing ? "Otimizando fotos..." : saving ? `Enviando fotos ${progress}/${items.filter(item => !item.existing).length}...` : "Salvando..."}>Salvar fotos</PendingSubmitButton>
    </form>
  );
}
