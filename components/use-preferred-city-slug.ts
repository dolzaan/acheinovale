"use client";

import { useEffect, useState } from "react";
import { CITY_COOKIE_NAME, DEFAULT_CITY_SLUG, normalizeCitySlug } from "@/lib/location/city-preference";

function readPreferredCitySlug() {
  const cityCookie = document.cookie
    .split(";")
    .map(cookie => cookie.trim())
    .find(cookie => cookie.startsWith(`${CITY_COOKIE_NAME}=`));

  if (!cityCookie) return undefined;
  return normalizeCitySlug(decodeURIComponent(cityCookie.slice(cityCookie.indexOf("=") + 1)));
}

export function usePreferredCitySlug(citySlug?: string) {
  const explicitCitySlug = normalizeCitySlug(citySlug);
  const [resolvedCitySlug, setResolvedCitySlug] = useState(explicitCitySlug || DEFAULT_CITY_SLUG);

  useEffect(() => {
    if (explicitCitySlug) return;
    const preferredCitySlug = readPreferredCitySlug();
    if (preferredCitySlug) queueMicrotask(() => setResolvedCitySlug(preferredCitySlug));
  }, [explicitCitySlug]);

  return resolvedCitySlug;
}
