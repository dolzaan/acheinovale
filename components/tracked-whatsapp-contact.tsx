"use client";

import { useEffect } from "react";

type Props = {
  kind: "freteiros" | "imoveis";
  publicCode: string;
  whatsappUrl: string;
  className?: string;
};

/** Link de WhatsApp que registra uma visualização por sessão e cada clique no contato. */
export function TrackedWhatsappContact({ kind, publicCode, whatsappUrl, className = "button button--primary" }: Props) {
  const endpoint = `/api/${kind}/${encodeURIComponent(publicCode)}/evento`;

  useEffect(() => {
    const key = `acheinovale:${kind}:view:${publicCode}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // A métrica ainda pode ser registrada quando o navegador bloqueia o armazenamento local.
    }
    void fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "view" }),
      keepalive: true,
    });
  }, [endpoint, kind, publicCode]);

  function trackWhatsapp() {
    void fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "whatsapp" }),
      keepalive: true,
    });
  }

  return <a className={className} href={whatsappUrl} target="_blank" rel="noreferrer" onClick={trackWhatsapp}>Conversar no WhatsApp</a>;
}
