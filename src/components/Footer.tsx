interface FooterProps {
  rightText?: string;
}

export default function Footer({ rightText = "ДВИГАЙТЕ КУРСОРОМ · ИССЛЕДУЙТЕ ПРОСТРАНСТВО" }: FooterProps) {
  return (
    <footer className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex h-14 items-center justify-between border-t border-white/10 bg-brand-navy-deep/40 px-6 backdrop-blur-md sm:px-10">
      <span className="font-mono-label text-[10px] text-brand-muted">
        © 2026 SANBAZAR
      </span>
      <span className="font-mono-label text-[10px] text-brand-muted">
        {rightText}
      </span>
    </footer>
  );
}
