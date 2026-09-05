"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useCart } from "@/components/CartProvider";
import {
  SHOPPING_AGENT_URL,
  startSession,
  streamChat,
  type AgentProduct,
  type ProductsUiPayload,
} from "@/lib/shoppingAgent";

const priceFormatter = new Intl.NumberFormat("ru-RU");

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
  products?: ProductsUiPayload;
  suggestions?: string[];
}

export default function ShoppingAssistant() {
  const { addItem } = useCart();
  const [open, setOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const ensureSession = useCallback(async () => {
    if (sessionId) return sessionId;
    const id = await startSession();
    setSessionId(id);
    return id;
  }, [sessionId]);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || busy) return;
      setInput("");
      setError(null);
      setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
      setBusy(true);

      const assistantIndex = { current: -1 };
      setMessages((prev) => {
        assistantIndex.current = prev.length;
        return [...prev, { role: "assistant", text: "" }];
      });

      try {
        const id = await ensureSession();
        await streamChat(id, trimmed, (event) => {
          if (event.type === "text_delta") {
            const delta = (event.data as { text: string }).text;
            setMessages((prev) => {
              const next = [...prev];
              const msg = next[assistantIndex.current];
              if (msg) next[assistantIndex.current] = { ...msg, text: msg.text + delta };
              return next;
            });
          } else if (event.type === "ui") {
            const { component, payload } = event.data as { component: string; payload: unknown };
            setMessages((prev) => {
              const next = [...prev];
              const msg = next[assistantIndex.current];
              if (!msg) return prev;
              if (component === "products") {
                next[assistantIndex.current] = { ...msg, products: payload as ProductsUiPayload };
              } else if (component === "suggestions") {
                next[assistantIndex.current] = {
                  ...msg,
                  suggestions: (payload as { suggestions: string[] }).suggestions,
                };
              }
              return next;
            });
          } else if (event.type === "error") {
            setError((event.data as { message: string }).message);
          }
        });
      } catch {
        setError("Не удалось связаться с ассистентом. Попробуйте ещё раз.");
      } finally {
        setBusy(false);
      }
    },
    [busy, ensureSession]
  );

  const handleAddToCart = (product: AgentProduct) => {
    addItem({ id: product.product_id, article: product.product_id, title: product.title, price: product.price });
  };

  // Пока сервис-ассистент не задеплоен (нет URL) — виджета просто нет на сайте.
  if (!SHOPPING_AGENT_URL) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        data-cursor-magnetic
        className="font-mono-label fixed bottom-6 left-6 z-40 flex items-center gap-2 rounded-full bg-brand-blue px-5 py-3.5 text-[12px] uppercase tracking-wide text-white shadow-lg transition-colors hover:bg-brand-blue-light"
      >
        {open ? "Закрыть ✕" : "Спросить консультанта"}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 left-6 z-40 flex h-[min(600px,70vh)] w-[min(400px,90vw)] flex-col overflow-hidden rounded-2xl border border-white/10 bg-brand-navy-deep/95 shadow-2xl backdrop-blur-md"
          >
            <div className="border-b border-white/10 px-4 py-3">
              <p className="font-mono-label text-[10px] uppercase text-brand-blue-light">SanBazar</p>
              <p className="font-display text-[14px] font-semibold text-brand-ink">AI-консультант по каталогу</p>
            </div>

            <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
              {messages.length === 0 && (
                <p className="text-[13px] leading-relaxed text-brand-muted">
                  Спросите, например: «Подбери сифон для кухни подешевле» или «Чем отличаются V150-30 и V512-18-MR?»
                </p>
              )}
              {messages.map((m, i) => (
                <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
                  {m.text && (
                    <p
                      className={`inline-block max-w-[85%] rounded-xl px-3 py-2 text-[13px] leading-relaxed ${
                        m.role === "user"
                          ? "bg-brand-blue text-white"
                          : "bg-white/5 text-brand-ink"
                      }`}
                    >
                      {m.text}
                    </p>
                  )}
                  {m.products && (
                    <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                      {m.products.items.map(({ product, reason }) => (
                        <div
                          key={product.product_id}
                          className="w-36 shrink-0 rounded-xl border border-white/10 bg-white/5 p-2"
                        >
                          <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-white/5">
                            {product.image_url && (
                              <Image
                                src={product.image_url}
                                alt={product.title}
                                fill
                                sizes="144px"
                                className="object-contain p-1"
                              />
                            )}
                          </div>
                          <p className="mt-1.5 line-clamp-2 text-[11px] font-semibold leading-snug text-brand-ink">
                            {product.title}
                          </p>
                          <p className="text-[12px] font-bold text-brand-ink">
                            {priceFormatter.format(product.price)} ₸
                          </p>
                          {reason && <p className="line-clamp-2 text-[10px] text-brand-muted">{reason}</p>}
                          <button
                            type="button"
                            onClick={() => handleAddToCart(product)}
                            disabled={!product.in_stock}
                            className="font-mono-label mt-1.5 w-full rounded-full bg-brand-blue px-2 py-1.5 text-[9px] uppercase text-white transition-colors hover:bg-brand-blue-light disabled:opacity-40"
                          >
                            {product.in_stock ? "В корзину" : "Нет в наличии"}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {m.suggestions && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {m.suggestions.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => send(s)}
                          className="font-mono-label rounded-full border border-white/15 px-3 py-1.5 text-[10px] text-brand-muted transition-colors hover:border-brand-blue/50 hover:text-brand-ink"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {error && <p className="text-[12px] text-red-400">{error}</p>}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="flex gap-2 border-t border-white/10 p-3"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Спросите про товар…"
                disabled={busy}
                className="input-base flex-1"
              />
              <button
                type="submit"
                disabled={busy || !input.trim()}
                className="font-mono-label rounded-full bg-brand-blue px-4 py-2 text-[11px] uppercase text-white transition-colors hover:bg-brand-blue-light disabled:opacity-40"
              >
                {busy ? "…" : "→"}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
