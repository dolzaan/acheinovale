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
  return <svg {...base(size)} stroke="none" {...props}><path fill="#a85527" d="M12 3 23 9 13 15 2 9Z"/><path fill="#f8e8c5" d="M4 11 13 16 13 23 4 18Z"/><path fill="#e4a030" d="M13 16 21 11 21 18 13 23Z"/><path fill="#1d402d" d="M7 15 10 17 10 21 7 19Z"/><path fill="#e4a030" d="M12 3 13 15 2 9Z"/></svg>;
}

export function TruckIcon({ size = 22, ...props }: IconProps) {
  return <svg {...base(size)} stroke="none" {...props}><path fill="#f8e8c5" d="M1 6 12 2 18 6 7 11Z"/><path fill="#e4a030" d="M1 6 7 11 7 19 1 14Z"/><path fill="#a85527" d="M7 11 18 6 18 14 7 19Z"/><path fill="#315b40" d="M18 9 22 11 24 15 24 18 15 22 15 15Z"/><path fill="#e8eee9" d="M19 11 22 13 23 15 19 16Z"/><ellipse fill="#153020" cx="7" cy="19" rx="2.5" ry="3"/><ellipse fill="#153020" cx="19" cy="20" rx="2.5" ry="3"/></svg>;
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
  return <svg {...base(size)} stroke="none" {...props}><path fill="#e8eee9" d="M3 5 12 1 20 5 11 10Z"/><path fill="#315b40" d="M3 5 11 10 11 23 3 18Z"/><path fill="#1d402d" d="M11 10 20 5 20 18 11 23Z"/><path stroke="#e4a030" strokeWidth="2" d="m6 10 2 1m-2 3 2 1m6-3 3-2m-3 6 3-2"/></svg>;
}

export function BedIcon({ size = 17, ...props }: IconProps) {
  return <svg {...base(size)} stroke="none" {...props}><path fill="#315b40" d="M2 4 9 1 9 11 2 15Z"/><path fill="#e4a030" d="M2 13 15 7 23 12 10 19Z"/><path fill="#a85527" d="M2 13 10 19 10 22 2 17Z"/><path fill="#1d402d" d="M10 19 23 12 23 16 10 22Z"/><path fill="#fff9ec" d="M3 11 8 8 13 11 8 14Z"/><path fill="#f8e8c5" d="M10 14 16 11 21 14 15 17Z"/></svg>;
}

export function BathIcon({ size = 17, ...props }: IconProps) {
  return <svg {...base(size)} stroke="none" {...props}><path fill="#315b40" d="M5 9V4Q5 0 10 2L11 5 8 5 8 4 7 4V9Z"/><path fill="#e8eee9" d="M1 10 14 5 23 11 10 17Z"/><path fill="#8eaa96" d="M1 10 10 17 10 22 4 18Z"/><path fill="#315b40" d="M10 17 23 11 20 18 10 22Z"/><path fill="#f8e8c5" d="M4 10 14 7 20 11 10 15Z"/></svg>;
}

export function ChevronDownIcon({ size = 17, ...props }: IconProps) {
  return <svg {...base(size)} {...props}><path d="m6 9 6 6 6-6"/></svg>;
}

export function FilterIcon({ size = 18, ...props }: IconProps) {
  return <svg {...base(size)} {...props}><path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/></svg>;
}

export function InstagramIcon({ size = 20, ...props }: IconProps) {
  return <svg {...base(size)} {...props}><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".6" fill="currentColor"/></svg>;
}

export function CarIcon({ size = 17, ...props }: IconProps) {
  return <svg {...base(size)} {...props}><path d="M5 17h14M5 17v2M19 17v2M4 17v-4l2-5h12l2 5v4M4 13h16M8 15h.01M16 15h.01"/></svg>;
}

export function AreaIcon({ size = 17, ...props }: IconProps) {
  return <svg {...base(size)} stroke="none" {...props}><path fill="#e4a030" d="M1 9 13 2 23 9 11 16Z"/><path fill="#a85527" d="M1 9 11 16 11 21 1 14Z"/><path fill="#c17a2b" d="M11 16 23 9 23 14 11 21Z"/><path stroke="#fff9ec" strokeWidth="1.3" d="m5 7 3 2m1-4 3 2m2-3 3 2m-9 6 3-2m3 5 3-2"/></svg>;
}

export function WavesIcon({ size = 17, ...props }: IconProps) {
  return <svg {...base(size)} {...props}><path d="M2 8c2-1.5 4-1.5 6 0s4 1.5 6 0 4-1.5 6 0M2 13c2-1.5 4-1.5 6 0s4 1.5 6 0 4-1.5 6 0M2 18c2-1.5 4-1.5 6 0s4 1.5 6 0 4-1.5 6 0"/></svg>;
}

export function LandIcon({ size = 17, ...props }: IconProps) {
  return <svg {...base(size)} {...props}><path d="M3 20h18M5 20l4-7 3 4 3-6 4 9M15 6a2 2 0 1 0 0-.01"/></svg>;
}
