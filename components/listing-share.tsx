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
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.7 10.6 6.6-4.2M8.7 13.4l6.6 4.2"/></svg>
          <span className="listing-share__button-label">{copied ? "Link copiado!" : "Compartilhar"}</span>
        </button>
        {open ? (
          <div className="listing-share__menu" role="group" aria-label="Escolha onde compartilhar">
            <a href={whatsapp} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}>
              <span className="listing-share__option-icon listing-share__option-icon--whatsapp">W</span>
              WhatsApp
            </a>
            <a href={facebook} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}>
              <span className="listing-share__option-icon listing-share__option-icon--facebook">f</span>
              Facebook
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
