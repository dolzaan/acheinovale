"use client";

import { useEffect } from "react";
import { clearPropertyDraft } from "@/lib/forms/property-draft";

export function ClearPropertyDraft() {
  useEffect(() => {
    void clearPropertyDraft().catch(() => undefined);
  }, []);

  return <p className="form-alert form-alert--success">Imóvel enviado para análise. O rascunho local foi removido.</p>;
}
