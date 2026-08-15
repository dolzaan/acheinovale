"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

type GalleryImage = { id: string; src: string; alt: string; position: number };
type GalleryVideo = { id: string; src: string; mimeType: string; position: number };
type GalleryMedia =
  | ({ kind: "image" } & GalleryImage)
  | ({ kind: "video" } & GalleryVideo);

export function PropertyGallery({ images, videos, title }: { images: GalleryImage[]; videos: GalleryVideo[]; title: string }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [durations, setDurations] = useState<Record<string, number>>({});
  const [isFullscreen, setIsFullscreen] = useState(false);
  const pointerStart = useRef<number | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const lightboxRef = useRef<HTMLDivElement>(null);
  const media = useMemo<GalleryMedia[]>(() => [
    ...images.map(image => ({ ...image, kind: "image" as const })),
    ...videos.map(video => ({ ...video, kind: "video" as const })),
  ].sort((a, b) => a.position - b.position), [images, videos]);
  const visibleMedia = useMemo(() => {
    if (media.length <= 5) return media;
    const firstVideoIndex = media.findIndex(item => item.kind === "video");
    if (firstVideoIndex >= 5) return [...media.slice(0, 3), media[firstVideoIndex], media[3]];
    return media.slice(0, 5);
  }, [media]);
  const activeMedia = activeIndex === null ? null : media[activeIndex];

  function formatDuration(seconds?: number) {
    if (!seconds || !Number.isFinite(seconds)) return "";
    const minutes = Math.floor(seconds / 60);
    return `${minutes}:${Math.floor(seconds % 60).toString().padStart(2, "0")}`;
  }

  function rememberDuration(id: string, duration: number) {
    if (Number.isFinite(duration)) setDurations(current => current[id] === duration ? current : { ...current, [id]: duration });
  }

  async function toggleFullscreen() {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await lightboxRef.current?.requestFullscreen();
  }

  const showPrevious = useCallback(() => {
    setActiveIndex(current => current === null ? null : (current - 1 + media.length) % media.length);
  }, [media.length]);

  const showNext = useCallback(() => {
    setActiveIndex(current => current === null ? null : (current + 1) % media.length);
  }, [media.length]);

  useEffect(() => {
    if (activeIndex === null) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setActiveIndex(null);
      if (event.key === "ArrowLeft") showPrevious();
      if (event.key === "ArrowRight") showNext();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeIndex, showNext, showPrevious]);

  useEffect(() => {
    function handleFullscreenChange() { setIsFullscreen(Boolean(document.fullscreenElement)); }
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.target instanceof HTMLVideoElement) return;
    pointerStart.current = event.clientX;
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.target instanceof HTMLVideoElement) return;
    if (pointerStart.current === null) return;
    const distance = event.clientX - pointerStart.current;
    pointerStart.current = null;
    if (Math.abs(distance) < 45) return;
    if (distance > 0) showPrevious();
    else showNext();
  }

  return (
    <div className="property-media-stack">
      {media.length ? (
        <div className={`listing-gallery listing-gallery--count-${Math.min(visibleMedia.length, 5)} ${media.length === 1 ? "listing-gallery--single" : ""}`}>
          {visibleMedia.map((item, index) => {
            const mediaIndex = media.findIndex(mediaItem => mediaItem.kind === item.kind && mediaItem.id === item.id);
            const isLastVisible = index === visibleMedia.length - 1;
            return (
              <button className={`${index === 0 ? "listing-gallery__photo listing-gallery__photo--cover" : "listing-gallery__photo"}${item.kind === "video" ? " listing-gallery__video" : ""}`} type="button" key={`${item.kind}-${item.id}`} onClick={() => setActiveIndex(mediaIndex)} aria-label={item.kind === "image" ? `Abrir foto ${mediaIndex + 1} de ${media.length}` : `Abrir vídeo do imóvel, item ${mediaIndex + 1} de ${media.length}`}>
                {item.kind === "image" ? (
                  <Image src={item.src} alt={item.alt} fill priority={index === 0} sizes={index === 0 ? "(max-width: 680px) 100vw, 65vw" : "(max-width: 680px) 50vw, 25vw"} />
                ) : (
                  <><video muted playsInline preload="metadata" aria-hidden="true" onLoadedMetadata={event => rememberDuration(item.id, event.currentTarget.duration)}><source src={item.src} type={item.mimeType} /></video><span className="listing-gallery__play"><i aria-hidden="true" />Vídeo{durations[item.id] ? ` · ${formatDuration(durations[item.id])}` : ""}</span></>
                )}
                {isLastVisible && media.length > visibleMedia.length ? <span className="listing-gallery__more">+{media.length - visibleMedia.length} mídias</span> : null}
              </button>
            );
          })}
          <button className="listing-gallery__open" type="button" onClick={() => setActiveIndex(0)}>{images.length ? (videos.length ? "Ver fotos e vídeo" : "Ver todas as fotos") : "Ver vídeo"}</button>
        </div>
      ) : null}

      {activeIndex !== null && activeMedia ? (
        <div ref={lightboxRef} className="photo-lightbox" role="dialog" aria-modal="true" aria-label={`Galeria de fotos e vídeos de ${title}`} onPointerDown={handlePointerDown} onPointerUp={handlePointerUp}>
          <button ref={closeButtonRef} className="photo-lightbox__close" type="button" onClick={() => setActiveIndex(null)} aria-label="Fechar galeria">×</button>
          <button className="photo-lightbox__fullscreen" type="button" onClick={toggleFullscreen} aria-label={isFullscreen ? "Sair da tela cheia" : "Abrir em tela cheia"}>{isFullscreen ? "Sair da tela cheia" : "Tela cheia"}</button>
          {media.length > 1 ? <button className="photo-lightbox__arrow photo-lightbox__arrow--previous" type="button" onClick={showPrevious} aria-label="Mídia anterior">‹</button> : null}
          <div className={activeMedia.kind === "image" ? "photo-lightbox__image" : "photo-lightbox__image photo-lightbox__image--video"}>
            {activeMedia.kind === "image" ? (
              <Image src={activeMedia.src} alt={activeMedia.alt} fill sizes="100vw" priority />
            ) : (
              <video key={activeMedia.id} controls playsInline preload="metadata" aria-label={`Vídeo de ${title}`} onLoadedMetadata={event => rememberDuration(activeMedia.id, event.currentTarget.duration)}>
                <source src={activeMedia.src} type={activeMedia.mimeType} />
                Seu navegador não consegue reproduzir este vídeo.
              </video>
            )}
          </div>
          {media.length > 1 ? <button className="photo-lightbox__arrow photo-lightbox__arrow--next" type="button" onClick={showNext} aria-label="Próxima mídia">›</button> : null}
          {media.length > 1 ? (
            <div className="photo-lightbox__thumbnails" aria-label="Selecionar mídia">
              {media.map((item, index) => (
                <button className={index === activeIndex ? "photo-lightbox__thumbnail photo-lightbox__thumbnail--active" : "photo-lightbox__thumbnail"} type="button" key={`thumb-${item.kind}-${item.id}`} onClick={() => setActiveIndex(index)} aria-label={`Abrir ${item.kind === "image" ? "foto" : "vídeo"} ${index + 1}`}>
                  {item.kind === "image" ? <Image src={item.src} alt="" fill sizes="72px" /> : <><video src={item.src} muted playsInline preload="metadata" onLoadedMetadata={event => rememberDuration(item.id, event.currentTarget.duration)} aria-hidden="true" /><span>▶{durations[item.id] ? ` ${formatDuration(durations[item.id])}` : ""}</span></>}
                </button>
              ))}
            </div>
          ) : null}
          <div className="photo-lightbox__footer"><span>{activeIndex + 1} de {media.length}</span><small>Arraste para o lado ou use as setas</small></div>
        </div>
      ) : null}
    </div>
  );
}
