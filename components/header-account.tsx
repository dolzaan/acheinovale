"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { signOut } from "@/app/auth/actions";
import { ChevronDownIcon } from "./icons";
import { PendingSubmitButton } from "./pending-submit-button";
import { UserAvatar } from "./user-avatar";
import { useAccountSession } from "./account-session-provider";

export function HeaderAccount() {
  const { user, loading } = useAccountSession();
  const menuRef = useRef<HTMLDetailsElement>(null);
  const [open, setOpen] = useState(false);

  // Fecha com Esc ou clique fora, como o seletor de cidade.
  useEffect(() => {
    if (!open) return;
    function close(event: KeyboardEvent | PointerEvent) {
      const menu = menuRef.current;
      if (!menu) return;
      if (event instanceof KeyboardEvent) {
        if (event.key !== "Escape") return;
        menu.open = false;
        menu.querySelector("summary")?.focus();
      } else if (event.target instanceof Node && !menu.contains(event.target)) {
        menu.open = false;
      }
    }
    document.addEventListener("keydown", close);
    document.addEventListener("pointerdown", close, { passive: true });
    return () => {
      document.removeEventListener("keydown", close);
      document.removeEventListener("pointerdown", close);
    };
  }, [open]);

  if (loading) {
    return <span className="login-link" aria-label="Carregando conta">Conta</span>;
  }

  if (!user) {
    return <Link prefetch={false} className="login-link" href="/entrar">Entrar</Link>;
  }

  return (
    <details ref={menuRef} className="user-menu" onToggle={event => setOpen(event.currentTarget.open)}>
      <summary><UserAvatar image={user.image} name={user.name} /><span>{user.name?.split(" ")[0] || "Minha conta"}</span><ChevronDownIcon /></summary>
      <div className="user-menu__panel">
        <div className="user-menu__identity"><strong>{user.name || "Usuário"}</strong><small>{user.email}</small></div>
        <Link prefetch={false} href="/perfil">Meu perfil</Link>
        <Link prefetch={false} href="/meus-anuncios">Meus anúncios</Link>
        {user.role === "ADMIN" ? <Link prefetch={false} href="/admin/anuncios">Moderar anúncios</Link> : null}
        <Link prefetch={false} href="/favoritos">Favoritos</Link>
        <Link prefetch={false} href="/alertas">Alertas de imóveis</Link>
        <form action={signOut}><PendingSubmitButton pendingText="Saindo…">Sair</PendingSubmitButton></form>
      </div>
    </details>
  );
}
