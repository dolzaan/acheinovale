"use client";

import Link from "next/link";
import { signOut } from "@/app/auth/actions";
import { ChevronDownIcon } from "./icons";
import { PendingSubmitButton } from "./pending-submit-button";
import { UserAvatar } from "./user-avatar";
import { useAccountSession } from "./account-session-provider";

export function HeaderAccount() {
  const { user, loading } = useAccountSession();

  if (loading) {
    return <span className="login-link" aria-label="Carregando conta">Entrar</span>;
  }

  if (!user) {
    return <Link prefetch={false} className="login-link" href="/entrar">Entrar</Link>;
  }

  return (
    <details className="user-menu">
      <summary><UserAvatar image={user.image} name={user.name} /><span>{user.name?.split(" ")[0] || "Minha conta"}</span><ChevronDownIcon /></summary>
      <div className="user-menu__panel">
        <div className="user-menu__identity"><strong>{user.name || "Usuário"}</strong><small>{user.email}</small></div>
        <Link prefetch={false} href="/perfil">Meu perfil</Link>
        <Link prefetch={false} href="/meus-anuncios">Meus anúncios</Link>
        {user.role === "ADMIN" ? <Link prefetch={false} href="/admin/anuncios">Moderar anúncios</Link> : null}
        <Link prefetch={false} href="/favoritos">Favoritos <small>em breve</small></Link>
        <form action={signOut}><PendingSubmitButton pendingText="Saindo...">Sair</PendingSubmitButton></form>
      </div>
    </details>
  );
}
