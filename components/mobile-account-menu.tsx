"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { signOut } from "@/app/auth/actions";
import { HeartIcon, PlusIcon, UserIcon } from "./icons";
import { UserAvatar } from "./user-avatar";

type MobileAccountMenuProps = {
  user: {
    name: string | null;
    email: string;
    image: string | null;
  } | null;
};

export function MobileAccountMenu({ user }: MobileAccountMenuProps) {
  const [open, setOpen] = useState(false);
  const sheetId = useId();
  const titleId = useId();
  const sheetRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    sheetRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  if (!user) {
    return (
      <Link prefetch={false} className="mobile-nav__item" href="/entrar?next=/perfil">
        <UserIcon />
        <span>Entrar</span>
      </Link>
    );
  }

  const closeMenu = () => setOpen(false);

  return (
    <>
      <button
        type="button"
        className="mobile-nav__item mobile-account-trigger"
        aria-expanded={open}
        aria-controls={sheetId}
        onClick={() => setOpen(true)}
      >
        <UserIcon />
        <span>Perfil</span>
      </button>

      {open ? createPortal(
        <div className="mobile-account-menu" role="presentation">
          <button className="mobile-account-menu__backdrop" type="button" aria-label="Fechar menu da conta" onClick={closeMenu} />
          <section ref={sheetRef} id={sheetId} tabIndex={-1} className="mobile-account-menu__sheet" role="dialog" aria-modal="true" aria-labelledby={titleId}>
            <div className="mobile-account-menu__handle" aria-hidden="true" />
            <header className="mobile-account-menu__header">
              <UserAvatar image={user.image} name={user.name} size="lg" />
              <div>
                <h2 id={titleId}>{user.name || "Minha conta"}</h2>
                <span>{user.email}</span>
              </div>
              <button type="button" className="mobile-account-menu__close" onClick={closeMenu} aria-label="Fechar menu">×</button>
            </header>

            <nav className="mobile-account-menu__links" aria-label="Opções da conta">
              <Link prefetch={false} href="/perfil" onClick={closeMenu}>
                <span className="mobile-account-menu__icon"><UserIcon size={21} /></span>
                <span><strong>Meu perfil</strong><small>Dados pessoais e contato</small></span>
              </Link>
              <Link prefetch={false} href="/meus-anuncios" onClick={closeMenu}>
                <span className="mobile-account-menu__icon"><PlusIcon size={21} /></span>
                <span><strong>Meus anúncios</strong><small>Gerencie imóveis e serviços</small></span>
              </Link>
              <Link prefetch={false} href="/favoritos" onClick={closeMenu}>
                <span className="mobile-account-menu__icon"><HeartIcon size={21} /></span>
                <span><strong>Favoritos</strong><small>Itens que você salvou</small></span>
              </Link>
            </nav>

            <Link prefetch={false} className="button button--primary mobile-account-menu__publish" href="/publicar" onClick={closeMenu}>
              <PlusIcon size={19} /> Publicar anúncio
            </Link>
            <form action={signOut}>
              <button type="submit" className="mobile-account-menu__signout">Sair da conta</button>
            </form>
          </section>
        </div>,
        document.body,
      ) : null}
    </>
  );
}
