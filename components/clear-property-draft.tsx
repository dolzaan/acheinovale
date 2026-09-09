"use client";

import { useEffect } from "react";
import { clearPropertyDraft } from "@/lib/forms/property-draft";

export function ClearPropertyDraft({ ownerKey }: { ownerKey: string }) {
  useEffect(() => {
    void clearPropertyDraft(ownerKey).catch(() => undefined);
  }, [ownerKey]);

  return <p className="form-alert form-alert--success">Imóvel enviado para análise. O rascunho local foi removido.</p>;
}
