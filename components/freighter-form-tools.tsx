"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ListingQualityIndicator } from "@/components/listing-quality-indicator";
import { UserAvatar } from "@/components/user-avatar";

type PreviewData = {
  city: string;
  description: string;
  displayName: string;
  priceNote: string;
  services: string[];
  vehicles: string[];
};

const COMPLETION_ITEMS = [
  "Informe um WhatsApp válido",
  "Escolha a cidade base",
  "Descreva o serviço com pelo menos 60 caracteres",
  "Adicione uma foto profissional",
  "Selecione ao menos um tipo de veículo",
];

function text(data: FormData, name: string) {
  const value = data.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export function FreighterFormTools({ hasPhoto, image, initialCompleted }: { hasPhoto: boolean; image?: string | null; initialCompleted: number }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [qualityItems, setQualityItems] = useState(() => COMPLETION_ITEMS.map((label, index) => ({ label, complete: index < initialCompleted })));
  const [preview, setPreview] = useState<PreviewData | null>(null);

  const readForm = useCallback(() => {
    const form = rootRef.current?.closest("form");
    if (!form) return null;
    const data = new FormData(form);
    const citySelect = form.elements.namedItem("cityId") as HTMLSelectElement | null;
    const photoInput = form.elements.namedItem("photo") as HTMLInputElement | null;
    const values: PreviewData = {
      city: citySelect?.selectedOptions[0]?.text || "Cidade base",
      description: text(data, "description") || "Conte como funciona o seu serviço.",
      displayName: text(data, "displayName") || "Nome profissional",
      priceNote: text(data, "priceNote") || "Orçamento sem compromisso",
      services: text(data, "services").split(",").map(item => item.trim()).filter(Boolean),
      vehicles: data.getAll("vehicleTypes").filter((item): item is string => typeof item === "string"),
    };
    setQualityItems([
      { label: COMPLETION_ITEMS[0], complete: text(data, "whatsapp").replace(/\D/g, "").length >= 10 },
      { label: COMPLETION_ITEMS[1], complete: Boolean(text(data, "cityId")) },
      { label: COMPLETION_ITEMS[2], complete: text(data, "description").length >= 60 },
      { label: COMPLETION_ITEMS[3], complete: hasPhoto || Boolean(photoInput?.files?.length) },
      { label: COMPLETION_ITEMS[4], complete: values.vehicles.length > 0 },
    ]);
    return values;
  }, [hasPhoto]);

  useEffect(() => {
    const form = rootRef.current?.closest("form");
    if (!form) return;
    const update = () => { readForm(); };
    readForm();
    form.addEventListener("input", update);
    form.addEventListener("change", update);
    return () => {
      form.removeEventListener("input", update);
      form.removeEventListener("change", update);
    };
  }, [readForm]);

  useEffect(() => {
    if (!preview) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setPreview(null); };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [preview]);

  return (
    <div ref={rootRef} className="freighter-form-tools field-wide">
      <ListingQualityIndicator title="Qualidade do cadastro" items={qualityItems} />
      <button className="button button--secondary" type="button" onClick={() => setPreview(readForm())}>Ver prévia antes de salvar</button>

      {preview ? (
        <div className="freighter-preview" role="dialog" aria-modal="true" aria-label="Prévia do cadastro de freteiro">
          <button className="freighter-preview__close" type="button" onClick={() => setPreview(null)} aria-label="Fechar prévia">×</button>
          <article className="freighter-preview__card">
            <UserAvatar image={image} name={preview.displayName} size="lg" />
            <span className="freighter-profile-badge">Prévia do perfil</span>
            <h2>{preview.displayName}</h2>
            <small>{preview.city}</small>
            <p>{preview.description}</p>
            <div className="service-tags">{[...preview.services, ...preview.vehicles].slice(0, 6).map((item, index) => <span key={`${item}-${index}`}>{item}</span>)}</div>
            <strong>{preview.priceNote}</strong>
          </article>
        </div>
      ) : null}
    </div>
  );
}
