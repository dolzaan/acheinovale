"use client";

import { useState } from "react";

export function ListingShare({ title, url }: { title: string; url: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const message = `Confira no Achei no Vale: ${title} — ${url}`;
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(message)}`;
  const facebook = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;

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
      <div className="listing-share__menu-wrap">
        <button
          className="listing-share__main-button"
          type="button"
          aria-label={copied ? "Link copiado" : "Compartilhar anúncio"}
          title="Compartilhar anúncio"
          aria-expanded={open}
          aria-haspopup="true"
          onClick={() => setOpen(value => !value)}
        >
          <span className="listing-share__brand-logos" aria-hidden="true">
            <svg className="listing-share__brand-whatsapp" viewBox="0 0 24 24"><path d="M20.2 3.8A11.4 11.4 0 0 0 2.3 17.5L.8 23.2l5.8-1.5A11.4 11.4 0 0 0 20.2 3.8ZM12 20a9 9 0 0 1-4.6-1.3l-.3-.2-3.4.9.9-3.3-.2-.4A9 9 0 1 1 12 20Zm4.9-6.7c-.3-.2-1.7-.8-2-.9s-.5-.2-.7.2-.8.9-.9 1.1-.3.2-.6.1a7.4 7.4 0 0 1-2.2-1.4 8.3 8.3 0 0 1-1.5-1.9c-.2-.3 0-.4.1-.6l.4-.5.2-.4c.1-.2 0-.4 0-.5l-.9-2.1c-.2-.5-.5-.4-.7-.4h-.6c-.2 0-.5.1-.8.4s-1 1-1 2.4 1 2.7 1.2 2.9a10.5 10.5 0 0 0 4 3.5c.6.2 1.1.4 1.5.5.6.2 1.2.2 1.6.1.5-.1 1.7-.7 1.9-1.3s.2-1.2.2-1.3-.2-.2-.5-.4Z"/></svg>
            <svg className="listing-share__brand-facebook" viewBox="0 0 24 24"><path d="M13.6 21v-8.2h2.8l.4-3.2h-3.2v-2c0-.9.3-1.6 1.6-1.6H17V3.1c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.3H7.5v3.2h2.8V21h3.3Z"/></svg>
          </span>
          <span className="listing-share__button-label">{copied ? "Link copiado!" : "Compartilhar"}</span>
        </button>
        {open ? (
          <div className="listing-share__menu" role="group" aria-label="Escolha onde compartilhar">
            <a href={whatsapp} aria-label="Compartilhar no WhatsApp" title="WhatsApp" target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}>
              <span className="listing-share__option-icon listing-share__option-icon--whatsapp" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M20.2 3.8A11.4 11.4 0 0 0 2.3 17.5L.8 23.2l5.8-1.5A11.4 11.4 0 0 0 20.2 3.8ZM12 20a9 9 0 0 1-4.6-1.3l-.3-.2-3.4.9.9-3.3-.2-.4A9 9 0 1 1 12 20Zm4.9-6.7c-.3-.2-1.7-.8-2-.9s-.5-.2-.7.2-.8.9-.9 1.1-.3.2-.6.1a7.4 7.4 0 0 1-2.2-1.4 8.3 8.3 0 0 1-1.5-1.9c-.2-.3 0-.4.1-.6l.4-.5.2-.4c.1-.2 0-.4 0-.5l-.9-2.1c-.2-.5-.5-.4-.7-.4h-.6c-.2 0-.5.1-.8.4s-1 1-1 2.4 1 2.7 1.2 2.9a10.5 10.5 0 0 0 4 3.5c.6.2 1.1.4 1.5.5.6.2 1.2.2 1.6.1.5-.1 1.7-.7 1.9-1.3s.2-1.2.2-1.3-.2-.2-.5-.4Z"/></svg></span>
            </a>
            <a href={facebook} aria-label="Compartilhar no Facebook" title="Facebook" target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}>
              <span className="listing-share__option-icon listing-share__option-icon--facebook" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M13.6 21v-8.2h2.8l.4-3.2h-3.2v-2c0-.9.3-1.6 1.6-1.6H17V3.1c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.3H7.5v3.2h2.8V21h3.3Z"/></svg></span>
            </a>
            <button type="button" onClick={copyLink}>
              <span className="listing-share__option-icon listing-share__option-icon--copy">↗</span>
              Copiar link
            </button>
            {typeof navigator !== "undefined" && typeof navigator.share === "function" ? (
              <button type="button" onClick={async () => {
                try {
                  await navigator.share({ title, text: `Confira este anúncio no Achei no Vale`, url });
                  setOpen(false);
                } catch {
                  // O usuário pode cancelar o compartilhamento sem qualquer ação adicional.
                }
              }}>
                <span className="listing-share__option-icon listing-share__option-icon--other">•••</span>
                Mais opções
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </nav>
  );
}
