import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.9,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
});

export function SearchIcon({ size = 20, ...props }: IconProps) {
  return <svg {...base(size)} {...props}><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>;
}

export function HomeIcon({ size = 22, ...props }: IconProps) {
  return <svg {...base(size)} {...props}><path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/></svg>;
}

export function TruckIcon({ size = 22, ...props }: IconProps) {
  return <svg {...base(size)} {...props}><path d="M3 6h11v11H3z"/><path d="M14 10h4l3 3v4h-7z"/><circle cx="7" cy="18" r="2"/><circle cx="18" cy="18" r="2"/></svg>;
}

export function PinIcon({ size = 18, ...props }: IconProps) {
  return <svg {...base(size)} {...props}><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg>;
}

export function HeartIcon({ size = 20, ...props }: IconProps) {
  return <svg {...base(size)} {...props}><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/></svg>;
}

export function ArrowIcon({ size = 18, ...props }: IconProps) {
  return <svg {...base(size)} {...props}><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>;
}

export function PlusIcon({ size = 22, ...props }: IconProps) {
  return <svg {...base(size)} {...props}><path d="M12 5v14M5 12h14"/></svg>;
}

export function UserIcon({ size = 22, ...props }: IconProps) {
  return <svg {...base(size)} {...props}><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>;
}

export function ShieldIcon({ size = 20, ...props }: IconProps) {
  return <svg {...base(size)} {...props}><path d="M12 22s8-3.5 8-10V5l-8-3-8 3v7c0 6.5 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></svg>;
}

export function StarIcon({ size = 16, ...props }: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}><path d="m12 2.7 2.8 5.8 6.4.9-4.6 4.5 1.1 6.4-5.7-3-5.7 3 1.1-6.4-4.6-4.5 6.4-.9L12 2.7Z"/></svg>;
}

export function BuildingIcon({ size = 22, ...props }: IconProps) {
  return <svg {...base(size)} {...props}><path d="M4 21h16M6 21V5h8v16M14 9h4v12M9 8h2M9 12h2M9 16h2"/></svg>;
}

export function BedIcon({ size = 17, ...props }: IconProps) {
  return <svg {...base(size)} {...props}><path d="M3 19v-8M21 19v-5a3 3 0 0 0-3-3H3v6h18M7 11V8h4a3 3 0 0 1 3 3"/></svg>;
}

export function BathIcon({ size = 17, ...props }: IconProps) {
  return <svg {...base(size)} {...props}><path d="M4 12h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-3ZM7 12V6a3 3 0 0 1 5-2M4 21l2-3M20 21l-2-3"/></svg>;
}

export function ChevronDownIcon({ size = 17, ...props }: IconProps) {
  return <svg {...base(size)} {...props}><path d="m6 9 6 6 6-6"/></svg>;
}

export function FilterIcon({ size = 18, ...props }: IconProps) {
  return <svg {...base(size)} {...props}><path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/></svg>;
}
