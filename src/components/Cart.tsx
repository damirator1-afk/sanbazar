"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useCart } from "@/components/CartProvider";

const TELEGRAM_BOT = "sanbazar_assistant_bot";
const priceFormatter = new Intl.NumberFormat("ru-RU");

function buildOrderText(items: { title: string; article: string; qty: number; price: number }[], total: number) {
  const lines = ["Здравствуйте! Хочу заказать:", ""];
  items.forEach((item, i) => {
    const sum = priceFormatter.format(item.price * item.qty);
    lines.push(`${i + 1}) ${item.title} (арт. ${item.article}) × ${item.qty} — ${sum} ₸`);
  });
  lines.push("", `Итого: ${priceFormatter.format(total)} ₸`);
  return lines.join("\n");
}

export default function Cart() {
  const { items, removeItem, setQty, clear, count, total } = useCart();
  const [open, setOpen] = useState(false);
  const [kaspiNotice, setKaspiNotice] = useState(false);

  const handleKaspiClick = () => {
    // Оплата Kaspi Pay ещё не подключена — нужен API-ключ продавца.
    // Кнопка уже стоит на месте, чтобы включить её было делом одной правки.
    setKaspiNotice(true);
    window.setTimeout(() => setKaspiNotice(false), 3500);
  };

  if (count === 0 && !open) return null;

  const orderUrl = `https://t.me/${TELEGRAM_BOT}?text=${encodeURIComponent(buildOrderText(items, total))}`;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        data-cursor-magnetic
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full border border-white/15 bg-brand-navy-deep/80 px-5 py-3.5 backdrop-blur-md transition-colors hover:border-brand-blue/50 sm:right-10"
      >
        <span className="font-mono-label text-[11px] uppercase text-brand-ink">Корзина</span>
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-blue px-1.5 text-[10px] font-bold text-white">
          {count}
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-50 bg-brand-navy-deep/70 backdrop-blur-sm"
              onClick={() => setOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            />
            <motion.div
              className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col border-l border-white/10 bg-brand-navy-deep p-6"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 32, stiffness: 320 }}
            >
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-bold text-brand-ink">Ваша корзина</h2>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="font-mono-label text-[11px] uppercase text-brand-muted hover:text-brand-ink"
                >
                  Закрыть ✕
                </button>
              </div>

              {items.length === 0 ? (
                <p className="mt-8 text-[13px] text-brand-muted">Пока пусто — добавьте товары из каталога.</p>
              ) : (
                <>
                  <div className="mt-6 flex-1 space-y-4 overflow-y-auto">
                    {items.map((item) => (
                      <div key={item.id} className="rounded-xl border border-white/10 bg-white/5 p-3.5">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-display text-[13px] font-semibold leading-snug text-brand-ink">
                              {item.title}
                            </p>
                            <p className="font-mono-label mt-1 text-[9px] uppercase text-brand-muted">
                              арт. {item.article}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="text-[16px] leading-none text-brand-muted hover:text-red-400"
                          >
                            ×
                          </button>
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setQty(item.id, item.qty - 1)}
                              className="flex h-6 w-6 items-center justify-center rounded-full border border-white/15 text-brand-ink hover:border-brand-blue/50"
                            >
                              −
                            </button>
                            <span className="w-6 text-center text-[13px] text-brand-ink">{item.qty}</span>
                            <button
                              type="button"
                              onClick={() => setQty(item.id, item.qty + 1)}
                              className="flex h-6 w-6 items-center justify-center rounded-full border border-white/15 text-brand-ink hover:border-brand-blue/50"
                            >
                              +
                            </button>
                          </div>
                          <span className="font-display text-[13px] font-bold text-brand-ink">
                            {priceFormatter.format(item.price * item.qty)} ₸
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 border-t border-white/10 pt-5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono-label text-[11px] uppercase text-brand-muted">Итого</span>
                      <span className="font-display text-xl font-bold text-brand-ink">
                        {priceFormatter.format(total)} ₸
                      </span>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2.5">
                      <a
                        href={orderUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        data-cursor-magnetic
                        className="font-mono-label flex items-center justify-center rounded-full bg-brand-blue px-3 py-3.5 text-center text-[11px] uppercase tracking-wide text-white transition-colors hover:bg-brand-blue-light"
                      >
                        Оформить в Telegram
                      </a>
                      <button
                        type="button"
                        onClick={handleKaspiClick}
                        data-cursor-magnetic
                        className="font-mono-label flex items-center justify-center rounded-full px-3 py-3.5 text-[11px] uppercase tracking-wide text-white transition-colors hover:brightness-110"
                        style={{ backgroundColor: "#e4213c" }}
                      >
                        Оплатить Kaspi
                      </button>
                    </div>
                    {kaspiNotice && (
                      <p className="mt-2.5 text-center text-[11px] leading-relaxed text-brand-muted">
                        Онлайн-оплата Kaspi скоро будет доступна — пока оформите заказ через Telegram.
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={clear}
                      className="font-mono-label mt-3 w-full text-center text-[10px] uppercase text-brand-muted hover:text-red-400"
                    >
                      Очистить корзину
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
