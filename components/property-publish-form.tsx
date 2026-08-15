"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { createProperty } from "@/app/publicar/imovel/actions";
import { MoneyInput } from "@/components/money-input";
import { PhoneInput } from "@/components/phone-input";
import { createClient } from "@/lib/supabase/client";
import {
  createPropertyImagePath,
  PROPERTY_IMAGE_LIMIT,
  PROPERTY_IMAGE_MAX_BYTES,
  PROPERTY_IMAGE_MIME_TYPES,
  STORAGE_BUCKETS,
} from "@/lib/supabase/storage";

type CityOption = {
  id: string;
  name: string;
  stateCode: string;
  neighborhoods: Array<{ id: string; name: string }>;
};

type SelectedPhoto = { id: string; file: File; preview: string };

export function PropertyPublishForm({ authUserId, cityId, phone, cities }: { authUserId: string; cityId: string; phone: string; cities: CityOption[] }) {
  const [photos, setPhotos] = useState<SelectedPhoto[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [photoError, setPhotoError] = useState("");
  const photosRef = useRef(photos);
  const imageKeysRef = useRef<HTMLInputElement>(null);
  const readyToSubmit = useRef(false);

  useEffect(() => { photosRef.current = photos; }, [photos]);
  useEffect(() => () => photosRef.current.forEach(photo => URL.revokeObjectURL(photo.preview)), []);

  function selectPhotos(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.currentTarget.files ?? []);
    event.currentTarget.value = "";
    setPhotoError("");
    if (!selected.length) return;
    if (photos.length + selected.length > PROPERTY_IMAGE_LIMIT) {
      setPhotoError(`Você pode adicionar no máximo ${PROPERTY_IMAGE_LIMIT} fotos.`);
      return;
    }
    const invalidType = selected.find(file => !PROPERTY_IMAGE_MIME_TYPES.includes(file.type as (typeof PROPERTY_IMAGE_MIME_TYPES)[number]));
    if (invalidType) {
      setPhotoError("Use apenas imagens JPG, PNG, WebP ou AVIF.");
      return;
    }
    const oversized = selected.find(file => file.size > PROPERTY_IMAGE_MAX_BYTES);
    if (oversized) {
      setPhotoError(`A foto “${oversized.name}” ultrapassa o limite de 6 MB.`);
      return;
    }
    setPhotos(current => [...current, ...selected.map(file => ({ id: crypto.randomUUID(), file, preview: URL.createObjectURL(file) }))]);
  }

  function removePhoto(id: string) {
    setPhotos(current => {
      const removed = current.find(photo => photo.id === id);
      if (removed) URL.revokeObjectURL(removed.preview);
      return current.filter(photo => photo.id !== id);
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (readyToSubmit.current) return;
    event.preventDefault();
    setPhotoError("");

    if (!photos.length) {
      readyToSubmit.current = true;
      event.currentTarget.requestSubmit();
      return;
    }

    setUploading(true);
    setProgress(0);
    const form = event.currentTarget;
    const supabase = createClient();

    try {
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (authError || auth.user?.id !== authUserId) throw new Error("Sua sessão expirou. Entre novamente.");

      const results = await Promise.all(photos.map(async photo => {
        const storageKey = createPropertyImagePath(authUserId, photo.file.type);
        const { error } = await supabase.storage.from(STORAGE_BUCKETS.properties).upload(storageKey, photo.file, {
          contentType: photo.file.type,
          cacheControl: "31536000",
          upsert: false,
        });
        setProgress(current => current + 1);
        return { storageKey, error };
      }));

      const uploadedKeys = results.filter(result => !result.error).map(result => result.storageKey);
      const failed = results.find(result => result.error);
      if (failed) {
        if (uploadedKeys.length) await supabase.storage.from(STORAGE_BUCKETS.properties).remove(uploadedKeys);
        throw new Error(failed.error?.message || "Não foi possível enviar as fotos.");
      }

      if (imageKeysRef.current) imageKeysRef.current.value = JSON.stringify(uploadedKeys);
      readyToSubmit.current = true;
      form.requestSubmit();
    } catch (error) {
      setUploading(false);
      setPhotoError(error instanceof Error ? error.message : "Não foi possível enviar as fotos. Tente novamente.");
    }
  }

  return (
    <form className="listing-form" action={createProperty} onSubmit={handleSubmit}>
      <input ref={imageKeysRef} type="hidden" name="imageKeys" defaultValue="[]" />
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
        {photoError ? <p className="property-photo-error" role="alert">{photoError}</p> : null}
      </section>

      <button className="button button--primary field-wide" type="submit" disabled={uploading}>{uploading ? `Enviando fotos ${progress}/${photos.length}...` : "Enviar para análise"}</button>
    </form>
  );
}
