"use client";

import { useEffect, useRef, useState } from "react";

const WHATSAPP_PATH = "M20.2 3.8A11.4 11.4 0 0 0 2.3 17.5L.8 23.2l5.8-1.5A11.4 11.4 0 0 0 20.2 3.8ZM12 20a9 9 0 0 1-4.6-1.3l-.3-.2-3.4.9.9-3.3-.2-.4A9 9 0 1 1 12 20Zm4.9-6.7c-.3-.2-1.7-.8-2-.9s-.5-.2-.7.2-.8.9-.9 1.1-.3.2-.6.1a7.4 7.4 0 0 1-2.2-1.4 8.3 8.3 0 0 1-1.5-1.9c-.2-.3 0-.4.1-.6l.4-.5.2-.4c.1-.2 0-.4 0-.5l-.9-2.1c-.2-.5-.5-.4-.7-.4h-.6c-.2 0-.5.1-.8.4s-1 1-1 2.4 1 2.7 1.2 2.9a10.5 10.5 0 0 0 4 3.5c.6.2 1.1.4 1.5.5.6.2 1.2.2 1.6.1.5-.1 1.7-.7 1.9-1.3s.2-1.2.2-1.3-.2-.2-.5-.4Z";
const FACEBOOK_PATH = "M13.6 21v-8.2h2.8l.4-3.2h-3.2v-2c0-.9.3-1.6 1.6-1.6H17V3.1c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.3H7.5v3.2h2.8V21h3.3Z";

export function ListingShare({ title, url }: { title: string; url: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const message = `Confira no Achei no Vale: ${title} — ${url}`;
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(message)}`;
  const facebook = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;

  useEffect(() => {
    if (!open) return;
    function close(event: KeyboardEvent | PointerEvent) {
      if (event instanceof KeyboardEvent ? event.key === "Escape" : event.target instanceof Node && !wrapRef.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener("keydown", close);
    document.addEventListener("pointerdown", close);
    return () => {
      document.removeEventListener("keydown", close);
      document.removeEventListener("pointerdown", close);
    };
  }, [open]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setOpen(false);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      window.prompt("Copie o link do anúncio:", url);
    }
  }

  return (
    <nav className="listing-share" aria-label="Compartilhar anúncio">
      <strong>Compartilhe este anúncio</strong>
      <div className="listing-share__menu-wrap" ref={wrapRef}>
        <button
          className="listing-share__main-button"
          type="button"
          aria-label="Compartilhar anúncio"
          title="Compartilhar anúncio"
          aria-expanded={open}
          aria-haspopup="true"
          onClick={() => setOpen(value => !value)}
        >
          <svg className="listing-share__share-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" /></svg>
          <span className="listing-share__button-label">Compartilhar</span>
        </button>
        {open ? (
          <div className="listing-share__menu" role="group" aria-label="Escolha onde compartilhar">
            <a href={whatsapp} aria-label="Compartilhar no WhatsApp" title="WhatsApp" target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}>
              <span className="listing-share__option-icon listing-share__option-icon--whatsapp" aria-hidden="true"><svg viewBox="0 0 24 24"><path d={WHATSAPP_PATH} /></svg></span>
            </a>
            <a href={facebook} aria-label="Compartilhar no Facebook" title="Facebook" target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}>
              <span className="listing-share__option-icon listing-share__option-icon--facebook" aria-hidden="true"><svg viewBox="0 0 24 24"><path d={FACEBOOK_PATH} /></svg></span>
            </a>
            <button type="button" aria-label="Copiar link" title="Copiar link" onClick={copyLink}>
              <span className="listing-share__option-icon listing-share__option-icon--copy" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" /><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" /></svg></span>
            </button>
          </div>
        ) : null}
        <span className="listing-share__status" role="status">{copied ? "Link copiado!" : ""}</span>
      </div>
    </nav>
  );
}
