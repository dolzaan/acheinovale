import Image from "next/image";
import Link from "next/link";

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className={`brand ${light ? "brand--light" : ""}`} aria-label="Achei no Vale — início">
      <Image
        className="brand__image"
        src={light ? "/brand/logo-gold.png" : "/brand/logo-green-compact.svg"}
        alt={light ? "Achei no Vale. Encontre perto. Resolva no Vale." : "Achei no Vale"}
        width={light ? 930 : 890}
        height={light ? 421 : 425}
        priority={!light}
      />
    </Link>
  );
}
