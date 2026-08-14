import Link from "next/link";

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className={`brand ${light ? "brand--light" : ""}`} aria-label="AcheiNoVale — início">
      <span className="brand__mark" aria-hidden="true">
        <svg viewBox="0 0 48 48" fill="none">
          <path d="M24 3.5c-9.7 0-17.6 7.6-17.6 17C6.4 33 24 44.5 24 44.5S41.6 33 41.6 20.5c0-9.4-7.9-17-17.6-17Z" fill="currentColor"/>
          <path d="m13.8 22.5 10.2-8 10.2 8v10.1H13.8V22.5Z" fill="white"/>
          <path d="M20.6 32.6V25h6.8v7.6" fill="#173f35"/>
        </svg>
      </span>
      <span className="brand__word">Achei<span>NoVale</span></span>
    </Link>
  );
}
