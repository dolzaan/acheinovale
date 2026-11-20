"use client";

import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";

export type AccountSessionUser = {
  name: string | null;
  email: string;
  image: string | null;
  role: "USER" | "ADMIN";
};

type AccountSession = {
  user: AccountSessionUser | null;
  loading: boolean;
};

const AccountSessionContext = createContext<AccountSession>({ user: null, loading: true });

// Mesmo teste do proxy.ts: os cookies de sessão do Supabase não são httpOnly.
function hasAuthCookie() {
  return document.cookie.split(";").some(cookie => {
    const name = cookie.trim().split("=")[0];
    return name.startsWith("sb-") && name.includes("-auth-token");
  });
}

export function AccountSessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AccountSession>({ user: null, loading: true });
  const pathname = usePathname();
  const checkedWithCookie = useRef<boolean | null>(null);

  // O provider fica no layout e sobrevive às navegações. Entrar (Google no navegador
  // + router.push) e sair (server action + redirect) não recarregam a página, então
  // a sessão é conferida de novo a cada troca de página em que o cookie apareceu ou sumiu.
  useEffect(() => {
    const cookiePresent = hasAuthCookie();
    if (checkedWithCookie.current === cookiePresent) return;
    checkedWithCookie.current = cookiePresent;

    // Sem cookie de sessão o visitante é anônimo: não precisa chamar a API.
    if (!cookiePresent) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- o cookie só existe no navegador.
      setSession({ user: null, loading: false });
      return;
    }

    setSession(current => current.loading ? current : { ...current, loading: true });
    const controller = new AbortController();
    let finished = false;

    fetch("/api/conta", {
      cache: "no-store",
      credentials: "same-origin",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    })
      .then(response => response.ok ? response.json() as Promise<{ user: AccountSessionUser | null }> : { user: null })
      .then(({ user }) => setSession({ user, loading: false }))
      .catch(error => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setSession({ user: null, loading: false });
      })
      .finally(() => { finished = true; });

    return () => {
      if (finished) return;
      // Navegou no meio da conferência: a próxima página confere de novo.
      controller.abort();
      checkedWithCookie.current = null;
    };
  }, [pathname]);

  const value = useMemo(() => session, [session]);
  return <AccountSessionContext.Provider value={value}>{children}</AccountSessionContext.Provider>;
}

export function useAccountSession() {
  return useContext(AccountSessionContext);
}
