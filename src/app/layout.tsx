import type { Metadata } from "next";
import { Unbounded, Golos_Text, JetBrains_Mono } from "next/font/google";
import { CartProvider } from "@/components/CartProvider";
import "./globals.css";

const unbounded = Unbounded({
  variable: "--font-syne",
  subsets: ["latin", "cyrillic"],
  weight: ["600", "700", "800"],
});

const golos = Golos_Text({
  variable: "--font-jakarta",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "SANBAZAR — Пространство современной сантехники",
  description:
    "Цифровой шоурум SANBAZAR: интерактивное 3D-пространство современной бытовой сантехники — смесители, санфаянс, душевые системы и инженерные решения для дома.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="ru"
      className={`${unbounded.variable} ${golos.variable} ${jetbrains.variable} h-full`}
    >
      <body className="min-h-full bg-brand-navy-deep text-brand-ink font-sans antialiased">
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
