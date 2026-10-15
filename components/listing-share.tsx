"use client";

import { useState } from "react";

export function ListingShare({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = useState(false);
  const message = `Confira no Achei no Vale: ${title} — ${url}`;
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(message)}`;
  const facebook = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      window.prompt("Copie o link do anúncio:", url);
    }
  }

  return (
    <nav className="listing-share" aria-label="Compartilhar anúncio">
      <div className="listing-share__heading">
        <strong>Gostou deste imóvel?</strong>
        <span>Compartilhe com quem pode se interessar.</span>
      </div>
      <div className="listing-share__actions">
        <a className="listing-share__button listing-share__button--whatsapp" href={whatsapp} target="_blank" rel="noopener noreferrer">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.2 3.8A11.4 11.4 0 0 0 2.3 17.5L.8 23.2l5.8-1.5A11.4 11.4 0 0 0 20.2 3.8ZM12 20a9 9 0 0 1-4.6-1.3l-.3-.2-3.4.9.9-3.3-.2-.4A9 9 0 1 1 12 20Zm4.9-6.7c-.3-.2-1.7-.8-2-.9s-.5-.2-.7.2-.8.9-.9 1.1-.3.2-.6.1a7.4 7.4 0 0 1-2.2-1.4 8.3 8.3 0 0 1-1.5-1.9c-.2-.3 0-.4.1-.6l.4-.5.2-.4c.1-.2 0-.4 0-.5l-.9-2.1c-.2-.5-.5-.4-.7-.4h-.6c-.2 0-.5.1-.8.4s-1 1-1 2.4 1 2.7 1.2 2.9a10.5 10.5 0 0 0 4 3.5c.6.2 1.1.4 1.5.5.6.2 1.2.2 1.6.1.5-.1 1.7-.7 1.9-1.3s.2-1.2.2-1.3-.2-.2-.5-.4Z"/></svg>
          WhatsApp
        </a>
        <a className="listing-share__button listing-share__button--facebook" href={facebook} target="_blank" rel="noopener noreferrer">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.6 21v-8.2h2.8l.4-3.2h-3.2v-2c0-.9.3-1.6 1.6-1.6H17V3.1c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.3H7.5v3.2h2.8V21h3.3Z"/></svg>
          Facebook
        </a>
        <button className="listing-share__button listing-share__button--copy" type="button" onClick={copyLink}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h3"/></svg>
          {copied ? "Link copiado!" : "Copiar link"}
        </button>
      </div>
    </nav>
  );
}
