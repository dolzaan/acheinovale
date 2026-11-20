"use client";

import { useEffect, type RefObject } from "react";

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), video[controls], [tabindex]:not([tabindex="-1"])';

/**
 * Foco de janela modal: ao abrir, vai para `initialFocusRef` (ou o próprio contêiner);
 * enquanto aberta, Tab e Shift+Tab circulam só dentro dela; ao fechar, volta para
 * o elemento que tinha o foco antes de abrir.
 */
export function useModalFocus(containerRef: RefObject<HTMLElement | null>, open: boolean, initialFocusRef?: RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    (initialFocusRef?.current ?? containerRef.current)?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      const container = containerRef.current;
      if (event.key !== "Tab" || !container) return;
      const items = [...container.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(item => item.getClientRects().length > 0);
      if (!items.length) {
        event.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const current = document.activeElement;
      const outside = !(current instanceof Node && container.contains(current));
      if (event.shiftKey && (current === first || outside)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (current === last || outside)) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (opener?.isConnected) opener.focus();
    };
    // As refs são estáveis; o efeito só deve rodar ao abrir e fechar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
}
