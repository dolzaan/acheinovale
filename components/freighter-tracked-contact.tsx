"use client";

import { useEffect } from "react";

export function FreighterTrackedContact({ publicCode, whatsappUrl }: { publicCode: string; whatsappUrl: string }) {
  const endpoint = `/api/freteiros/${encodeURIComponent(publicCode)}/evento`;

  useEffect(() => {
    const key = `acheinovale:freteiro:view:${publicCode}`;
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
  }, [endpoint, publicCode]);

  function trackWhatsapp() {
    void fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "whatsapp" }),
      keepalive: true,
    });
  }

  return <a className="button button--primary" href={whatsappUrl} target="_blank" rel="noreferrer" onClick={trackWhatsapp}>Conversar no WhatsApp</a>;
}
