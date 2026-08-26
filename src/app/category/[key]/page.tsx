import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CATEGORIES } from "@/lib/categories";
import { client } from "@/sanity/lib/client";
import { urlFor } from "@/sanity/lib/image";
import { PRODUCTS_BY_CATEGORY_QUERY, type Product, type RawProduct } from "@/sanity/lib/queries";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CustomCursor from "@/components/CustomCursor";
import ProductGrid from "@/components/ProductGrid";
import Cart from "@/components/Cart";

// re-fetch from Sanity at most every 10 sec — new/edited products in the
// Studio (incl. hiding a product) show up quickly without a redeploy
export const revalidate = 10;

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ key: c.key }));
}

type CategoryPageProps = {
  params: Promise<{ key: string }>;
};

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { key } = await params;
  const category = CATEGORIES.find((c) => c.key === key);
  if (!category) return {};
  return {
    title: `${category.title} — SANBAZAR`,
    description: category.tagline,
  };
}

async function getProducts(categoryKey: string): Promise<Product[]> {
  const raw = await client.fetch<RawProduct[]>(PRODUCTS_BY_CATEGORY_QUERY, { category: categoryKey });
  return raw.map((p) => ({
    id: p._id,
    article: p.article,
    title: p.title,
    brand: p.brand,
    price: p.price,
    inStock: p.inStock,
    description: p.description,
    specs: p.specs,
    // задавать только width (без height) — если задать оба, Sanity
    // автоматически обрезает фото под квадрат ("умный кроп" по хотспоту),
    // даже с fit("max"); нам нужно фото целиком, без обрезки
    imageUrl: p.images?.[0] ? urlFor(p.images[0]).width(700).fit("max").url() : null,
    modelUrl: p.modelUrl,
    analogs: (p.analogs ?? [])
      .filter((a) => !a.hidden)
      .map((a) => ({
        id: a._id,
        article: a.article,
        title: a.title,
        brand: a.brand,
        price: a.price,
        inStock: a.inStock,
        imageUrl: a.images?.[0] ? urlFor(a.images[0]).width(700).fit("max").url() : null,
        modelUrl: a.modelUrl,
      })),
  }));
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { key } = await params;
  const category = CATEGORIES.find((c) => c.key === key);
  if (!category) notFound();

  const others = CATEGORIES.filter((c) => c.key !== category.key);
  const products = await getProducts(category.key);

  return (
    <>
      <CustomCursor />
      <Header centerText={category.title.toUpperCase()} />

      <main className="relative min-h-screen overflow-hidden px-6 pb-24 pt-[110px] sm:px-10">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 55% at 82% 20%, rgba(226,153,63,0.14), transparent 70%), linear-gradient(155deg, #1a1108 0%, #120b05 55%, #030201 100%)",
          }}
          aria-hidden
        />

        <div className="relative z-10 mx-auto w-full max-w-6xl">
          <Link
            href="/"
            data-cursor-magnetic
            className="font-mono-label group inline-flex items-center gap-2 text-[11px] text-brand-muted transition-colors hover:text-brand-blue-light"
          >
            <svg width="14" height="10" viewBox="0 0 22 12" fill="none" aria-hidden className="rotate-180 transition-transform duration-300 group-hover:-translate-x-1">
              <path d="M0.5 6H21M21 6L16 1M21 6L16 11" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            НАЗАД В ШОУРУМ
          </Link>

          <p className="font-mono-label mt-10 text-[11px] uppercase text-brand-blue-light">
            {String(category.index + 1).padStart(2, "0")} / {String(CATEGORIES.length).padStart(2, "0")}
          </p>

          <h1 className="font-display mt-4 text-[clamp(38px,7vw,88px)] font-bold leading-[0.98] tracking-tight text-brand-ink">
            {category.title}
          </h1>

          <p className="mt-6 max-w-[480px] text-[15px] leading-relaxed text-brand-muted">
            {category.tagline}
          </p>

          <div className="mt-14">
            {products.length > 0 ? (
              <ProductGrid products={products} />
            ) : (
              <div className="rounded-2xl border border-white/10 bg-brand-navy-deep/50 px-8 py-12 backdrop-blur-md">
                <p className="font-mono-label text-[11px] uppercase text-brand-blue-light">Каталог</p>
                <p className="font-display mt-3 text-xl font-semibold text-brand-ink">
                  Товары этой категории скоро появятся здесь
                </p>
                <p className="mt-3 max-w-[440px] text-[14px] leading-relaxed text-brand-muted">
                  Пока страница — заготовка под будущий каталог SANBAZAR. Как только будут готовы карточки товаров,
                  мы разместим их прямо в этом разделе.
                </p>
              </div>
            )}
          </div>

          <div className="mt-14">
            <p className="font-mono-label mb-4 text-[10px] uppercase text-brand-muted">Другие категории</p>
            <ul className="flex flex-wrap gap-3" role="list">
              {others.map((c) => (
                <li key={c.key}>
                  <Link
                    href={`/category/${c.key}`}
                    data-cursor-magnetic
                    className="font-mono-label inline-block rounded-full border border-white/15 px-4 py-2 text-[11px] text-brand-muted transition-colors hover:border-brand-blue/50 hover:text-brand-ink"
                  >
                    {c.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>

      <Footer rightText="© 2026 SANBAZAR — ОПТОВЫЙ СКЛАД САНТЕХНИКИ" />
      <Cart />
    </>
  );
}
