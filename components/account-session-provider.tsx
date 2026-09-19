"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

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

export function AccountSessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AccountSession>({ user: null, loading: true });

  useEffect(() => {
    const hasAuthCookie = document.cookie.split(";").some(cookie => {
      const name = cookie.trim().split("=", 1)[0];
      return name.startsWith("sb-") && name.includes("-auth-token");
    });

    if (!hasAuthCookie) {
      queueMicrotask(() => setSession({ user: null, loading: false }));
      return;
    }

    const controller = new AbortController();

    fetch("/api/conta", {
      cache: "no-store",
      credentials: "same-origin",
      signal: controller.signal,
    })
      .then(response => response.ok ? response.json() as Promise<{ user: AccountSessionUser | null }> : { user: null })
      .then(({ user }) => setSession({ user, loading: false }))
      .catch(error => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setSession({ user: null, loading: false });
      });

    return () => controller.abort();
  }, []);

  const value = useMemo(() => session, [session]);
  return <AccountSessionContext.Provider value={value}>{children}</AccountSessionContext.Provider>;
}

export function useAccountSession() {
  return useContext(AccountSessionContext);
}
