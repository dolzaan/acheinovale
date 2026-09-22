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
    const controller = new AbortController();

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
      });

    return () => controller.abort();
  }, []);

  const value = useMemo(() => session, [session]);
  return <AccountSessionContext.Provider value={value}>{children}</AccountSessionContext.Provider>;
}

export function useAccountSession() {
  return useContext(AccountSessionContext);
}
