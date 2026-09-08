import Link from "next/link";

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className={`brand ${light ? "brand--light" : ""}`} aria-label="AcheiNoVale — início">
      <span className="brand__mark" aria-hidden="true">
        <svg viewBox="0 0 320 360" fill="none">
          <defs><clipPath id={light ? "logo-landscape-light" : "logo-landscape"}><circle cx="160" cy="145" r="92"/></clipPath></defs>
          <path d="M160 13C85.1 13 30 70.5 30 143.1 30 235.7 160 338 160 338s130-102.3 130-194.9C290 70.5 234.9 13 160 13Z" fill="currentColor"/>
          <circle cx="160" cy="145" r="92" fill={light ? "#1D402D" : "#FFF9EC"}/>
          <g clipPath={`url(#${light ? "logo-landscape-light" : "logo-landscape"})`}>
            <circle cx="203" cy="91" r="19" fill="#E4A030"/>
            <path d="M56 172 110 111l37 41 50-65 73 85v66H56Z" fill="#6F9477"/>
            <path d="M52 184q47-48 108 1 59-56 109-1v66H52Z" fill={light ? "#1D402D" : "#1D402D"}/>
            <path d="M161 160c-21 25-22 50 1 86" stroke="#A85527" strokeWidth="16" strokeLinecap="round"/>
          </g>
        </svg>
      </span>
      <span className="brand__word">Achei<span>NoVale</span></span>
    </Link>
  );
}
