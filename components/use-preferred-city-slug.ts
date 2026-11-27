"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { CITY_COOKIE_NAME, normalizeCitySlug, pickCitySlug } from "@/lib/location/city-preference";

function readPreferredCitySlug() {
  const cityCookie = document.cookie
    .split(";")
    .map(cookie => cookie.trim())
    .find(cookie => cookie.startsWith(`${CITY_COOKIE_NAME}=`));

  if (!cityCookie) return undefined;
  return normalizeCitySlug(decodeURIComponent(cityCookie.slice(cityCookie.indexOf("=") + 1)));
}

/**
 * O cabeçalho continua montado entre navegações; por isso a cidade da página é usada a cada
 * renderização (não só na primeira), e o cookie é relido quando a página muda.
 */
export function usePreferredCitySlug(citySlug?: string) {
  const pathname = usePathname();
  const [savedCitySlug, setSavedCitySlug] = useState<string | undefined>(undefined);

  useEffect(() => {
    const preferred = readPreferredCitySlug();
    queueMicrotask(() => setSavedCitySlug(preferred));
  }, [pathname, citySlug]);

  return pickCitySlug(citySlug, savedCitySlug);
}
