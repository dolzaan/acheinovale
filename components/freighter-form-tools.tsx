"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { UserAvatar } from "@/components/user-avatar";

type PreviewData = {
  city: string;
  description: string;
  displayName: string;
  priceNote: string;
  services: string[];
  vehicles: string[];
};

const COMPLETION_ITEMS = ["WhatsApp", "cidade", "descrição", "foto", "veículo"];

function text(data: FormData, name: string) {
  const value = data.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export function FreighterFormTools({ hasPhoto, image, initialCompleted }: { hasPhoto: boolean; image?: string | null; initialCompleted: number }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [completed, setCompleted] = useState(initialCompleted);
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
    const score = [
      Boolean(text(data, "whatsapp")),
      Boolean(text(data, "cityId")),
      Boolean(text(data, "description")),
      hasPhoto || Boolean(photoInput?.files?.length),
      values.vehicles.length > 0,
    ].filter(Boolean).length;
    setCompleted(score);
    return values;
  }, [hasPhoto]);

  useEffect(() => {
    const form = rootRef.current?.closest("form");
    if (!form) return;
    const update = () => { readForm(); };
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

  const percentage = Math.round((completed / COMPLETION_ITEMS.length) * 100);

  return (
    <div ref={rootRef} className="freighter-form-tools field-wide">
      <div className="freighter-completion">
        <div><strong>Cadastro {percentage}% completo</strong><span>{completed}/{COMPLETION_ITEMS.length} itens essenciais preenchidos</span></div>
        <div className="freighter-completion__track" aria-label={`${percentage}% do cadastro completo`}><span style={{ width: `${percentage}%` }} /></div>
      </div>
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
