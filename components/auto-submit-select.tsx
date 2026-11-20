"use client";

import type { SelectHTMLAttributes } from "react";

/**
 * Select que envia o próprio formulário ao mudar de opção. Sem JavaScript, o
 * formulário precisa de um botão de envio próprio (por exemplo, dentro de <noscript>).
 */
export function AutoSubmitSelect(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} onChange={event => event.currentTarget.form?.requestSubmit()} />;
}
