"use client";

import Image from "next/image";
import { useState, type DragEvent } from "react";

export type PropertyOrganizerItem = {
  id: string;
  kind: "image" | "video";
  preview: string;
  label?: string;
};

type Props = {
  items: PropertyOrganizerItem[];
  coverId: string | null;
  disabled?: boolean;
  onMove: (id: string, direction: -1 | 1) => void;
  onReorder: (sourceId: string, targetId: string) => void;
  onRemove: (id: string) => void;
  onSetCover: (id: string) => void;
};

export function PropertyMediaOrganizer({ items, coverId, disabled = false, onMove, onReorder, onRemove, onSetCover }: Props) {
  const [draggingId, setDraggingId] = useState<string | null>(null);

  function drop(event: DragEvent<HTMLDivElement>, targetId: string) {
    event.preventDefault();
    const sourceId = draggingId || event.dataTransfer.getData("text/plain");
    setDraggingId(null);
    if (sourceId && sourceId !== targetId) onReorder(sourceId, targetId);
  }

  if (!items.length) return null;

  return (
    <div className="property-media-organizer">
      <p>Arraste para ordenar no computador ou use as setas. A capa sempre será a primeira foto.</p>
      <div className="property-media-organizer__grid" role="list" aria-label="Ordem das mídias do anúncio">
        {items.map((item, index) => (
          <div
            className={`property-media-item${draggingId === item.id ? " property-media-item--dragging" : ""}`}
            draggable={!disabled}
            key={item.id}
            onDragStart={event => {
              setDraggingId(item.id);
              event.dataTransfer.effectAllowed = "move";
              event.dataTransfer.setData("text/plain", item.id);
            }}
            onDragEnd={() => setDraggingId(null)}
            onDragOver={event => event.preventDefault()}
            onDrop={event => drop(event, item.id)}
            role="listitem"
          >
            <div className="property-media-item__preview">
              {item.kind === "image" ? (
                <Image src={item.preview} alt={item.label || `Foto ${index + 1}`} fill sizes="(max-width: 680px) 44vw, 170px" unoptimized={item.preview.startsWith("blob:")} />
              ) : (
                <video src={item.preview} muted playsInline preload="metadata" aria-label={item.label || "Vídeo do imóvel"} />
              )}
              <span className="property-media-item__type">{item.kind === "video" ? "Vídeo" : `${index + 1}`}</span>
              {item.id === coverId ? <strong className="property-media-item__cover">Capa</strong> : null}
            </div>
            <div className="property-media-item__controls">
              <button type="button" onClick={() => onMove(item.id, -1)} disabled={disabled || index === 0} aria-label={`Mover ${item.kind === "image" ? "foto" : "vídeo"} para a esquerda`}>←</button>
              <button type="button" onClick={() => onMove(item.id, 1)} disabled={disabled || index === items.length - 1} aria-label={`Mover ${item.kind === "image" ? "foto" : "vídeo"} para a direita`}>→</button>
              {item.kind === "image" && item.id !== coverId ? <button className="property-media-item__cover-button" type="button" onClick={() => onSetCover(item.id)} disabled={disabled}>Usar como capa</button> : null}
              <button className="property-media-item__remove" type="button" onClick={() => onRemove(item.id)} disabled={disabled} aria-label={`Remover ${item.kind === "image" ? "foto" : "vídeo"}`}>Remover</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
