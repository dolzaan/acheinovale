"use client";

import { useFormStatus } from "react-dom";
import { useEffect, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from "react";

type PendingSubmitButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> & {
  children: ReactNode;
  pendingText?: string;
  busy?: boolean;
  navigation?: boolean;
};

export function PendingSubmitButton({
  children,
  pendingText = "Carregando...",
  busy = false,
  navigation = false,
  disabled,
  className = "",
  onClick,
  ...props
}: PendingSubmitButtonProps) {
  const { pending } = useFormStatus();
  const [navigationPending, setNavigationPending] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLoading = pending || busy || navigationPending;

  useEffect(() => () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    onClick?.(event);
    if (!navigation || event.defaultPrevented || !event.currentTarget.form?.checkValidity()) return;
    timeoutRef.current = setTimeout(() => {
      setNavigationPending(true);
      timeoutRef.current = setTimeout(() => setNavigationPending(false), 12000);
    }, 0);
  }

  return (
    <button
      {...props}
      type="submit"
      className={`${className} pending-button${isLoading ? " is-loading" : ""}`.trim()}
      onClick={handleClick}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      aria-disabled={disabled || isLoading}
    >
      {isLoading ? <span className="button-spinner" aria-hidden="true" /> : null}
      {isLoading ? <span className="pending-button__label">{pendingText}</span> : children}
    </button>
  );
}
