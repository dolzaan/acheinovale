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
      <strong>Compartilhe este anúncio</strong>
      <div className="listing-share__actions">
        <a href={whatsapp} target="_blank" rel="noopener noreferrer">WhatsApp</a>
        <a href={facebook} target="_blank" rel="noopener noreferrer">Facebook</a>
        <button type="button" onClick={copyLink}>{copied ? "Link copiado!" : "Copiar link"}</button>
      </div>
    </nav>
  );
}
