"use client";

import { useEffect } from "react";
import { track } from "@vercel/analytics";

export function PublishConversionEvent({ name }: { name: string }) {
  useEffect(() => {
    track(name);
  }, [name]);

  return null;
}
