"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ??
  "889496887255-67su0lan0kbjr2vohjbiah50id142bhe.apps.googleusercontent.com";

type CredentialResponse = {
  credential?: string;
};

type GoogleIdentity = {
  accounts: {
    id: {
      initialize(options: {
        client_id: string;
        callback: (response: CredentialResponse) => void;
        nonce: string;
        use_fedcm_for_prompt: boolean;
      }): void;
      renderButton(
        element: HTMLElement,
        options: {
          type: "standard";
          theme: "outline";
          size: "large";
          shape: "rectangular";
          text: "continue_with";
          logo_alignment: "left";
          width: number;
        },
      ): void;
    };
  };
};

declare global {
  interface Window {
    google?: GoogleIdentity;
  }
}

async function createNonce() {
  const nonceBytes = crypto.getRandomValues(new Uint8Array(32));
  const nonce = btoa(String.fromCharCode(...nonceBytes));
  const encodedNonce = new TextEncoder().encode(nonce);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encodedNonce);
  const hashedNonce = Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  return { nonce, hashedNonce };
}

export function GoogleSignInButton({ next }: { next: string }) {
  const buttonContainerRef = useRef<HTMLDivElement>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [supabase] = useState(() => createClient());
  const router = useRouter();

  const initializeGoogle = useCallback(async () => {
    const google = window.google;
    const container = buttonContainerRef.current;

    if (!google || !container) return;

    const { nonce, hashedNonce } = await createNonce();

    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      nonce: hashedNonce,
      use_fedcm_for_prompt: true,
      callback: async ({ credential }) => {
        if (!credential) {
          setError("O Google não retornou uma credencial válida. Tente novamente.");
          return;
        }

        setIsPending(true);
        setError(null);
        let sessionCreated = false;

        try {
          const { error: signInError } = await supabase.auth.signInWithIdToken({
            provider: "google",
            token: credential,
            nonce,
          });

          if (signInError) {
            throw signInError;
          }
          sessionCreated = true;

          const response = await fetch("/auth/google", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ next }),
          });

          if (!response.ok) {
            await supabase.auth.signOut();
            throw new Error("Falha ao sincronizar o usuário autenticado.");
          }

          const result = (await response.json()) as { redirectTo: string };
          router.push(result.redirectTo);
          router.refresh();
        } catch {
          if (sessionCreated) {
            await supabase.auth.signOut();
          }
          setIsPending(false);
          setError("Não foi possível entrar com o Google. Tente novamente.");
        }
      },
    });

    container.replaceChildren();
    google.accounts.id.renderButton(container, {
      type: "standard",
      theme: "outline",
      size: "large",
      shape: "rectangular",
      text: "continue_with",
      logo_alignment: "left",
      width: Math.min(container.clientWidth || 376, 400),
    });
  }, [next, router, supabase]);

  useEffect(() => {
    if (!scriptReady) return;
    void initializeGoogle();
  }, [initializeGoogle, scriptReady]);

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
        onError={() => setError("Não foi possível carregar o login do Google.")}
      />
      <div className="google-sign-in">
        <div
          ref={buttonContainerRef}
          className={isPending ? "google-sign-in__button is-pending" : "google-sign-in__button"}
          aria-busy={isPending}
        />
        {isPending && <span className="google-sign-in__status">Concluindo seu acesso...</span>}
      </div>
      {error && <p className="form-alert" role="alert">{error}</p>}
    </>
  );
}
