"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const NAVIGATION_TIMEOUT_MS = 12000;

function isInternalNavigation(event: MouseEvent, anchor: HTMLAnchorElement) {
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey ||
    anchor.target === "_blank" ||
    anchor.hasAttribute("download")
  ) return false;

  const href = anchor.getAttribute("href");
  if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return false;

  const destination = new URL(anchor.href, window.location.href);
  const current = new URL(window.location.href);
  if (destination.origin !== current.origin) return false;

  return destination.pathname !== current.pathname || destination.search !== current.search;
}

export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function stopLoading() {
      setLoading(false);
      document.body.classList.remove("is-route-loading");
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    stopLoading();
  }, [pathname, searchParams]);

  useEffect(() => {
    function startLoading() {
      setLoading(true);
      document.body.classList.add("is-route-loading");
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setLoading(false);
        document.body.classList.remove("is-route-loading");
        timeoutRef.current = null;
      }, NAVIGATION_TIMEOUT_MS);
    }

    function handleClick(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a");
      if (anchor && isInternalNavigation(event, anchor)) startLoading();
    }

    function handleSubmit(event: SubmitEvent) {
      const form = event.target;
      if (!(form instanceof HTMLFormElement) || form.target === "_blank") return;
      const destination = new URL(form.action || window.location.href, window.location.href);
      if (destination.origin !== window.location.origin) return;
      queueMicrotask(() => {
        if (!event.defaultPrevented) startLoading();
      });
    }

    document.addEventListener("click", handleClick, true);
    document.addEventListener("submit", handleSubmit, true);
    window.addEventListener("popstate", startLoading);

    return () => {
      document.removeEventListener("click", handleClick, true);
      document.removeEventListener("submit", handleSubmit, true);
      window.removeEventListener("popstate", startLoading);
      document.body.classList.remove("is-route-loading");
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  if (!loading) return null;

  return (
    <div className="route-progress" role="status" aria-live="polite">
      <span className="sr-only">Carregando a próxima página...</span>
    </div>
  );
}
