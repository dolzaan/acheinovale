"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const DISMISSED_AT_KEY = "acheinovale:pwa-install-dismissed-at";
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

function isStandalone() {
  const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    navigatorWithStandalone.standalone === true
  );
}

function wasRecentlyDismissed() {
  const dismissedAt = Number(window.localStorage.getItem(DISMISSED_AT_KEY));
  return Number.isFinite(dismissedAt) && Date.now() - dismissedAt < DISMISS_DURATION_MS;
}

export function PwaInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      const registerServiceWorker = () => {
        navigator.serviceWorker.register("/sw.js").catch(() => {
          // O site continua funcionando normalmente caso o navegador bloqueie o service worker.
        });
      };

      if (document.readyState === "complete") registerServiceWorker();
      else window.addEventListener("load", registerServiceWorker, { once: true });
    }

    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      if (isStandalone() || wasRecentlyDismissed()) return;

      setInstallPrompt(event as BeforeInstallPromptEvent);
      window.setTimeout(() => setIsVisible(true), 900);
    }

    function handleAppInstalled() {
      setIsVisible(false);
      setInstallPrompt(null);
      window.localStorage.removeItem(DISMISSED_AT_KEY);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  function dismiss() {
    window.localStorage.setItem(DISMISSED_AT_KEY, String(Date.now()));
    setIsVisible(false);
  }

  async function install() {
    if (!installPrompt || isInstalling) return;

    setIsInstalling(true);
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;

    if (outcome === "dismissed") {
      window.localStorage.setItem(DISMISSED_AT_KEY, String(Date.now()));
    }

    setInstallPrompt(null);
    setIsVisible(false);
    setIsInstalling(false);
  }

  if (!isVisible || !installPrompt) return null;

  return (
    <aside className="pwa-install" role="dialog" aria-labelledby="pwa-install-title">
      <button
        className="pwa-install__close"
        type="button"
        onClick={dismiss}
        aria-label="Agora não"
      >
        ×
      </button>
      <Image
        className="pwa-install__icon"
        src="/icons/icon-192x192.png"
        width={54}
        height={54}
        alt=""
      />
      <div className="pwa-install__content">
        <strong id="pwa-install-title">Instale o AcheiNoVale</strong>
        <span>Abra mais rápido e use como um app no seu celular.</span>
      </div>
      <button
        className="pwa-install__button"
        type="button"
        onClick={install}
        disabled={isInstalling}
      >
        {isInstalling ? "Abrindo..." : "Instalar app"}
      </button>
    </aside>
  );
}
