"use client";

import Image from "next/image";

interface HeaderProps {
  centerText?: string;
}

export default function Header({ centerText = "ПРОСТРАНСТВО СОВРЕМЕННОЙ САНТЕХНИКИ" }: HeaderProps) {
  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-30 flex h-[88px] items-center justify-between border-b border-white/10 bg-brand-navy-deep/40 px-6 backdrop-blur-md sm:px-10">
      <div className="pointer-events-auto flex items-center gap-3">
        <Image
          src="/logo-icon.png"
          alt="SANBAZAR"
          width={34}
          height={34}
          priority
          className="h-8 w-8 object-contain"
        />
        <div className="flex flex-col leading-none">
          <span className="font-display text-sm font-bold tracking-wide">
            SANBAZAR<span className="align-super text-[8px]">®</span>
          </span>
          <span className="font-mono-label mt-1 text-[9px] text-brand-muted">
            HOME COLLECTION
          </span>
        </div>
      </div>

      <div className="font-mono-label hidden text-[10px] text-brand-muted md:block">
        {centerText}
      </div>

      <div className="pointer-events-auto flex items-center gap-2.5">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-blue opacity-60" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand-blue" />
        </span>
        <span className="font-mono-label text-[10px] text-brand-muted">
          SHOWROOM ONLINE
        </span>
      </div>
    </header>
  );
}
