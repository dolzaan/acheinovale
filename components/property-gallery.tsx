"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

type GalleryImage = { id: string; src: string; alt: string };
type GalleryVideo = { id: string; src: string; mimeType: string };

export function PropertyGallery({ images, videos, title }: { images: GalleryImage[]; videos: GalleryVideo[]; title: string }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const pointerStart = useRef<number | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const visibleImages = useMemo(() => images.slice(0, 5), [images]);

  const showPrevious = useCallback(() => {
    setActiveIndex(current => current === null ? null : (current - 1 + images.length) % images.length);
  }, [images.length]);

  const showNext = useCallback(() => {
    setActiveIndex(current => current === null ? null : (current + 1) % images.length);
  }, [images.length]);

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

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    pointerStart.current = event.clientX;
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    if (pointerStart.current === null) return;
    const distance = event.clientX - pointerStart.current;
    pointerStart.current = null;
    if (Math.abs(distance) < 45) return;
    if (distance > 0) showPrevious();
    else showNext();
  }

  return (
    <div className="property-media-stack">
      {images.length ? (
        <div className={`listing-gallery listing-gallery--count-${Math.min(images.length, 5)} ${images.length === 1 ? "listing-gallery--single" : ""}`}>
          {visibleImages.map((photo, index) => (
            <button className={index === 0 ? "listing-gallery__photo listing-gallery__photo--cover" : "listing-gallery__photo"} type="button" key={photo.id} onClick={() => setActiveIndex(index)} aria-label={`Abrir foto ${index + 1} de ${images.length}`}>
              <Image src={photo.src} alt={photo.alt} fill priority={index === 0} sizes={index === 0 ? "(max-width: 680px) 100vw, 65vw" : "(max-width: 680px) 50vw, 25vw"} />
              {index === visibleImages.length - 1 && images.length > visibleImages.length ? <span className="listing-gallery__more">+{images.length - visibleImages.length} fotos</span> : null}
            </button>
          ))}
          <button className="listing-gallery__open" type="button" onClick={() => setActiveIndex(0)}>Ver todas as fotos</button>
        </div>
      ) : null}

      {videos.map(video => (
        <section className="listing-video" key={video.id}>
          <div><span>Vídeo do imóvel</span><strong>Faça um passeio pelos ambientes</strong></div>
          <video controls playsInline preload="metadata" aria-label={`Vídeo de ${title}`}>
            <source src={video.src} type={video.mimeType} />
            Seu navegador não consegue reproduzir este vídeo.
          </video>
        </section>
      ))}

      {activeIndex !== null ? (
        <div className="photo-lightbox" role="dialog" aria-modal="true" aria-label={`Galeria de fotos de ${title}`} onPointerDown={handlePointerDown} onPointerUp={handlePointerUp}>
          <button ref={closeButtonRef} className="photo-lightbox__close" type="button" onClick={() => setActiveIndex(null)} aria-label="Fechar galeria">×</button>
          {images.length > 1 ? <button className="photo-lightbox__arrow photo-lightbox__arrow--previous" type="button" onClick={showPrevious} aria-label="Foto anterior">‹</button> : null}
          <div className="photo-lightbox__image">
            <Image src={images[activeIndex].src} alt={images[activeIndex].alt} fill sizes="100vw" priority />
          </div>
          {images.length > 1 ? <button className="photo-lightbox__arrow photo-lightbox__arrow--next" type="button" onClick={showNext} aria-label="Próxima foto">›</button> : null}
          <div className="photo-lightbox__footer"><span>{activeIndex + 1} de {images.length}</span><small>Arraste para o lado ou use as setas</small></div>
        </div>
      ) : null}
    </div>
  );
}
