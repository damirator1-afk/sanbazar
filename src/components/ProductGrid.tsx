"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import type { AnalogProduct, Product } from "@/sanity/lib/queries";
import { useCart } from "@/components/CartProvider";
import { getBrandLogo } from "@/lib/brandLogos";

const ModelViewer = dynamic(() => import("@/components/ModelViewer"), { ssr: false });

interface ProductGridProps {
  products: Product[];
}

type SortOrder = "default" | "price-asc" | "price-desc";
type ZoomTarget = Pick<Product, "id" | "title" | "imageUrl" | "modelUrl">;

const priceFormatter = new Intl.NumberFormat("ru-RU");

export default function ProductGrid({ products }: ProductGridProps) {
  const brands = useMemo(() => {
    const set = new Set(products.map((p) => p.brand).filter((b): b is string => !!b));
    return Array.from(set).sort((a, b) => a.localeCompare(b, "ru"));
  }, [products]);

  const [brand, setBrand] = useState<string>("all");
  const [sort, setSort] = useState<SortOrder>("default");
  const [zoomed, setZoomed] = useState<ZoomTarget | null>(null);
  const [analogsOf, setAnalogsOf] = useState<Product | null>(null);

  useEffect(() => {
    if (!zoomed && !analogsOf) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setZoomed(null);
        setAnalogsOf(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [zoomed, analogsOf]);

  const visible = useMemo(() => {
    let list = brand === "all" ? products : products.filter((p) => p.brand === brand);
    if (sort === "price-asc") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "price-desc") list = [...list].sort((a, b) => b.price - a.price);
    return list;
  }, [products, brand, sort]);

  return (
    <div>
      {brands.length > 0 && (
        <div className="mb-8 flex flex-wrap items-center gap-4">
          <select
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            className="font-mono-label rounded-full border border-white/15 bg-brand-navy-deep/60 px-4 py-2 text-[11px] text-brand-ink outline-none transition-colors hover:border-brand-blue/50"
          >
            <option value="all">Все бренды</option>
            {brands.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOrder)}
            className="font-mono-label rounded-full border border-white/15 bg-brand-navy-deep/60 px-4 py-2 text-[11px] text-brand-ink outline-none transition-colors hover:border-brand-blue/50"
          >
            <option value="default">По умолчанию</option>
            <option value="price-asc">Сначала дешевле</option>
            <option value="price-desc">Сначала дороже</option>
          </select>

          <span className="font-mono-label text-[10px] text-brand-muted">
            {visible.length} {pluralizeItems(visible.length)}
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((p) => (
          <article
            key={p.id}
            className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-brand-navy-deep/50 backdrop-blur-md transition-colors hover:border-brand-blue/40"
          >
            <div className="relative aspect-square w-full bg-white/5">
              {p.imageUrl ? (
                <motion.div
                  layoutId={`product-photo-${p.id}`}
                  onClick={() => setZoomed(p)}
                  className="absolute inset-0 cursor-zoom-in"
                >
                  <Image
                    src={p.imageUrl}
                    alt={p.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-contain p-4 transition-transform duration-500 group-hover:scale-105"
                  />
                </motion.div>
              ) : p.modelUrl ? (
                <div
                  onClick={() => setZoomed(p)}
                  className="flex h-full w-full cursor-zoom-in items-center justify-center bg-gradient-to-br from-brand-blue/20 to-transparent"
                >
                  <span className="font-mono-label text-[10px] text-brand-blue-light">СМОТРЕТЬ В 3D</span>
                </div>
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <span className="font-mono-label text-[10px] text-brand-muted">ФОТО СКОРО</span>
                </div>
              )}
              {!p.inStock && (
                <span className="font-mono-label absolute left-3 top-3 rounded-full bg-brand-navy-deep/80 px-3 py-1 text-[9px] text-brand-muted backdrop-blur-md">
                  ПОД ЗАКАЗ
                </span>
              )}
              {p.modelUrl && (
                <span className="font-mono-label absolute right-3 top-3 rounded-full bg-brand-blue/90 px-3 py-1 text-[9px] text-white backdrop-blur-md">
                  3D
                </span>
              )}
            </div>

            <div className="flex flex-1 flex-col p-5">
              {p.brand && (
                <div className="flex items-center gap-2">
                  {getBrandLogo(p.brand) && (
                    <span className="flex h-7 w-11 shrink-0 items-center justify-center rounded-md bg-white/95 p-1">
                      <Image
                        src={getBrandLogo(p.brand)!}
                        alt=""
                        width={72}
                        height={40}
                        className="h-full w-full object-contain"
                      />
                    </span>
                  )}
                  <span className="font-mono-label text-[9px] uppercase text-brand-blue-light">{p.brand}</span>
                </div>
              )}
              <h3 className="font-display mt-1.5 text-[15px] font-semibold leading-snug text-brand-ink">
                {p.title}
              </h3>
              {p.specs && (
                <p className="mt-2 line-clamp-2 text-[12px] leading-relaxed text-brand-muted">{p.specs}</p>
              )}
              <div className="mt-auto pt-4">
                <div className="flex items-center gap-2">
                  <span className="font-display text-lg font-bold text-brand-ink">
                    {priceFormatter.format(p.price)} ₸
                  </span>
                  <span className="font-mono-label rounded-full bg-white/10 px-2 py-0.5 text-[9px] uppercase text-brand-muted">
                    ОПТ
                  </span>
                </div>
                <AddToCartButton product={p} />
                {p.analogs.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setAnalogsOf(p)}
                    data-cursor-magnetic
                    className="font-mono-label mt-2 flex w-full items-center justify-center rounded-full border border-white/15 px-4 py-2.5 text-[11px] uppercase tracking-wide text-brand-muted transition-colors hover:border-brand-blue/50 hover:text-brand-ink"
                  >
                    Показать аналоги ({p.analogs.length})
                  </button>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>

      <AnimatePresence>
        {zoomed && (zoomed.imageUrl || zoomed.modelUrl) && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-brand-navy-deep/85 px-6 pt-[104px] pb-[76px] backdrop-blur-sm sm:px-12"
            onClick={() => setZoomed(null)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <button
              type="button"
              onClick={() => setZoomed(null)}
              className="font-mono-label absolute right-6 top-[120px] z-10 rounded-full border border-white/15 bg-brand-navy-deep/70 px-4 py-2 text-[11px] uppercase text-brand-muted transition-colors hover:border-brand-blue/50 hover:text-brand-ink sm:right-12"
            >
              Закрыть ✕
            </button>

            {zoomed.modelUrl ? (
              <div
                onClick={(e) => e.stopPropagation()}
                className="relative h-full max-h-[calc(100vh-180px)] w-full max-w-3xl cursor-grab overflow-hidden rounded-2xl border border-white/10 bg-brand-navy/60 active:cursor-grabbing"
              >
                <ModelViewer url={zoomed.modelUrl} />
              </div>
            ) : (
              <motion.div
                layoutId={`product-photo-${zoomed.id}`}
                onClick={(e) => e.stopPropagation()}
                className="relative aspect-square w-full max-w-2xl max-h-[calc(100vh-180px)] cursor-zoom-out"
              >
                <Image
                  src={zoomed.imageUrl!}
                  alt={zoomed.title}
                  fill
                  sizes="90vw"
                  className="object-contain"
                />
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {analogsOf && (
          <motion.div
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-brand-navy-deep/85 px-6 pt-[104px] pb-[76px] backdrop-blur-sm sm:px-12"
            onClick={() => setAnalogsOf(null)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-4xl rounded-2xl border border-white/10 bg-brand-navy-deep/90 p-6 backdrop-blur-md sm:p-8"
            >
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono-label text-[10px] uppercase text-brand-blue-light">Аналоги</p>
                  <h3 className="font-display mt-1 text-xl font-semibold text-brand-ink">{analogsOf.title}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setAnalogsOf(null)}
                  className="font-mono-label shrink-0 rounded-full border border-white/15 bg-brand-navy-deep/70 px-4 py-2 text-[11px] uppercase text-brand-muted transition-colors hover:border-brand-blue/50 hover:text-brand-ink"
                >
                  Закрыть ✕
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[analogsOf, ...analogsOf.analogs].map((a) => (
                  <div
                    key={a.id}
                    className="flex flex-col overflow-hidden rounded-xl border border-white/10 bg-brand-navy/50"
                  >
                    <div className="relative aspect-square w-full bg-white/5">
                      {a.id === analogsOf.id && (
                        <span className="font-mono-label absolute left-2 top-2 z-10 rounded-full bg-brand-blue/90 px-2.5 py-1 text-[8px] text-white backdrop-blur-md">
                          ТЕКУЩИЙ
                        </span>
                      )}
                      {a.imageUrl ? (
                        <div onClick={() => setZoomed(a)} className="absolute inset-0 cursor-zoom-in">
                          <Image
                            src={a.imageUrl}
                            alt={a.title}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            className="object-contain p-3"
                          />
                        </div>
                      ) : a.modelUrl ? (
                        <div
                          onClick={() => setZoomed(a)}
                          className="flex h-full w-full cursor-zoom-in items-center justify-center bg-gradient-to-br from-brand-blue/20 to-transparent"
                        >
                          <span className="font-mono-label text-[10px] text-brand-blue-light">СМОТРЕТЬ В 3D</span>
                        </div>
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <span className="font-mono-label text-[10px] text-brand-muted">ФОТО СКОРО</span>
                        </div>
                      )}
                      {!a.inStock && (
                        <span className="font-mono-label absolute right-2 top-2 rounded-full bg-brand-navy-deep/80 px-2.5 py-1 text-[8px] text-brand-muted backdrop-blur-md">
                          ПОД ЗАКАЗ
                        </span>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-4">
                      {a.brand && (
                        <span className="font-mono-label text-[9px] uppercase text-brand-blue-light">{a.brand}</span>
                      )}
                      <h4 className="font-display mt-1 text-[14px] font-semibold leading-snug text-brand-ink">
                        {a.title}
                      </h4>
                      <div className="mt-auto pt-3">
                        <span className="font-display text-base font-bold text-brand-ink">
                          {priceFormatter.format(a.price)} ₸
                        </span>
                        <AddToCartButton product={a} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AddToCartButton({ product }: { product: Pick<Product | AnalogProduct, "id" | "article" | "title" | "price"> }) {
  const { addItem } = useCart();
  const [justAdded, setJustAdded] = useState(false);

  const handleClick = () => {
    addItem({ id: product.id, article: product.article, title: product.title, price: product.price });
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1400);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      data-cursor-magnetic
      className={`font-mono-label mt-3 flex w-full items-center justify-center rounded-full px-4 py-2.5 text-[11px] uppercase tracking-wide text-white transition-colors ${
        justAdded ? "bg-emerald-500" : "bg-brand-blue hover:bg-brand-blue-light"
      }`}
    >
      {justAdded ? "Добавлено ✓" : "В корзину"}
    </button>
  );
}

function pluralizeItems(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "товар";
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return "товара";
  return "товаров";
}
