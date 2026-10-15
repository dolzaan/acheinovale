"use client";

import Link from "next/link";
import { useEffect, type ReactNode } from "react";
import { track } from "@vercel/analytics";

export function PublishConversionEvent({ name }: { name: string }) {
  useEffect(() => {
    track(name);
  }, [name]);

  return null;
}

export function PublishOptionLink({
  href,
  type,
  children,
}: {
  href: string;
  type: "imovel" | "frete";
  children: ReactNode;
}) {
  return (
    <Link href={href} onClick={() => track("publish_type_selected", { type })}>
      {children}
    </Link>
  );
}
