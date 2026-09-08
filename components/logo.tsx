import Image from "next/image";
import Link from "next/link";

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className={`brand ${light ? "brand--light" : ""}`} aria-label="Achei no Vale — início">
      <Image
        className="brand__image"
        src={light ? "/brand/logo-gold.png" : "/brand/logo-green.png"}
        alt="Achei no Vale. Encontre perto. Resolva no Vale."
        width={930}
        height={421}
        priority={!light}
      />
    </Link>
  );
}
