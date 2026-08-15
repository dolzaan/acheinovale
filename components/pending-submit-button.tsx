"use client";

import { useFormStatus } from "react-dom";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type PendingSubmitButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> & {
  children: ReactNode;
  pendingText?: string;
  busy?: boolean;
};

export function PendingSubmitButton({
  children,
  pendingText = "Carregando...",
  busy = false,
  disabled,
  className = "",
  ...props
}: PendingSubmitButtonProps) {
  const { pending } = useFormStatus();
  const isLoading = pending || busy;

  return (
    <button
      {...props}
      type="submit"
      className={`${className} pending-button${isLoading ? " is-loading" : ""}`.trim()}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      aria-disabled={disabled || isLoading}
    >
      {isLoading ? <span className="button-spinner" aria-hidden="true" /> : null}
      {isLoading ? <span className="pending-button__label">{pendingText}</span> : children}
    </button>
  );
}
