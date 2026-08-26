"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { PRODUCT_CATEGORIES } from "@/sanity/schemaTypes/product";

type SubmitState = "idle" | "loading" | "success" | "error";

function classifyFiles(files: File[]): { photos: File[]; video: File | null; model: File | null } {
  const photos: File[] = [];
  let video: File | null = null;
  let model: File | null = null;
  for (const f of files) {
    if (/\.(glb|gltf)$/i.test(f.name)) {
      model = f;
    } else if (f.type.startsWith("video/") || /\.(mp4|mov)$/i.test(f.name)) {
      video = f;
    } else if (f.type.startsWith("image/") || /\.(jpe?g|png|webp)$/i.test(f.name)) {
      photos.push(f);
    }
  }
  return { photos, video, model };
}

export default function AdminUploadPage() {
  const [category, setCategory] = useState<string>(PRODUCT_CATEGORIES[0].key);
  const [article, setArticle] = useState("");
  const [title, setTitle] = useState("");
  const [brand, setBrand] = useState("");
  const [price, setPrice] = useState("");
  const [inStock, setInStock] = useState(true);
  const [description, setDescription] = useState("");
  const [specs, setSpecs] = useState("");
  const [social, setSocial] = useState(false);

  const [photos, setPhotos] = useState<File[]>([]);
  const [video, setVideo] = useState<File | null>(null);
  const [model, setModel] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const [state, setState] = useState<SubmitState>("idle");
  const [message, setMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((incoming: File[]) => {
    const { photos: newPhotos, video: newVideo, model: newModel } = classifyFiles(incoming);
    if (newPhotos.length) setPhotos((prev) => [...prev, ...newPhotos]);
    if (newVideo) setVideo(newVideo);
    if (newModel) setModel(newModel);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragOver(false);
      addFiles(Array.from(e.dataTransfer.files));
    },
    [addFiles]
  );

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setArticle("");
    setTitle("");
    setBrand("");
    setPrice("");
    setInStock(true);
    setDescription("");
    setSpecs("");
    setSocial(false);
    setPhotos([]);
    setVideo(null);
    setModel(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("loading");
    setMessage(null);

    const categoryTitle = PRODUCT_CATEGORIES.find((c) => c.key === category)?.title || "";

    const form = new FormData();
    form.set("category", category);
    form.set("categoryTitle", categoryTitle);
    form.set("article", article.trim());
    form.set("title", title.trim());
    form.set("brand", brand.trim());
    form.set("price", price);
    form.set("inStock", String(inStock));
    form.set("description", description.trim());
    form.set("specs", specs.trim());
    form.set("social", String(social));
    photos.forEach((f) => form.append("photos", f));
    if (video) form.set("video", video);
    if (model) form.set("model", model);

    try {
      const res = await fetch("/api/admin/upload-product", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка загрузки");

      setState("success");
      setMessage(
        data.social
          ? `Товар «${article}» загружен на сайт. ${data.social}`
          : `Товар «${article}» загружен на сайт.`
      );
      resetForm();
    } catch (err) {
      setState("error");
      setMessage((err as Error).message);
    }
  };

  return (
    <>
      <Header centerText="ЗАГРУЗКА ТОВАРА" />

      <main className="relative min-h-screen overflow-hidden px-6 pb-24 pt-[110px] sm:px-10">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 55% at 82% 20%, rgba(226,153,63,0.14), transparent 70%), linear-gradient(155deg, #1a1108 0%, #120b05 55%, #030201 100%)",
          }}
          aria-hidden
        />

        <div className="relative z-10 mx-auto w-full max-w-3xl">
          <div className="flex items-center gap-3">
            <Image src="/logo-icon.png" alt="" width={40} height={40} className="h-10 w-10 object-contain" />
            <div>
              <p className="font-mono-label text-[11px] uppercase text-brand-blue-light">SanBazar · Админ</p>
              <h1 className="font-display text-2xl font-bold text-brand-ink">Добавить товар</h1>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-10 flex flex-col gap-8">
            {/* Дропзона файлов */}
            <div>
              <p className="font-mono-label mb-3 text-[10px] uppercase text-brand-muted">
                Фото, видео и 3D-модель — перетащите сразу все файлы, разберём сами
              </p>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
                  dragOver ? "border-brand-blue bg-brand-blue/10" : "border-white/15 hover:border-brand-blue/50"
                }`}
              >
                <p className="font-display text-[15px] font-semibold text-brand-ink">
                  Перетащите файлы сюда или нажмите, чтобы выбрать
                </p>
                <p className="mt-2 text-[12px] text-brand-muted">
                  Фото (jpg/png/webp), видео (mp4/mov) и 3D-модель (glb/gltf) — определим тип автоматически
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,video/mp4,video/quicktime,.glb,.gltf"
                  className="hidden"
                  onChange={(e) => {
                    addFiles(Array.from(e.target.files || []));
                    e.target.value = "";
                  }}
                />
              </div>

              {(photos.length > 0 || video || model) && (
                <div className="mt-4 flex flex-wrap gap-3">
                  {photos.map((f, i) => (
                    <div key={i} className="group relative h-24 w-24 overflow-hidden rounded-xl border border-white/10 bg-white/5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={URL.createObjectURL(f)} alt="" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removePhoto(i)}
                        className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-[11px] text-white opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {video && (
                    <div className="group relative h-24 w-24 overflow-hidden rounded-xl border border-brand-blue/40 bg-white/5">
                      <video src={URL.createObjectURL(video)} className="h-full w-full object-cover" muted />
                      <span className="font-mono-label absolute left-1 top-1 rounded bg-black/70 px-1.5 py-0.5 text-[8px] text-white">
                        ВИДЕО
                      </span>
                      <button
                        type="button"
                        onClick={() => setVideo(null)}
                        className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-[11px] text-white opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        ×
                      </button>
                    </div>
                  )}
                  {model && (
                    <div className="group relative flex h-24 w-24 flex-col items-center justify-center gap-1 overflow-hidden rounded-xl border border-brand-blue/40 bg-brand-blue/10 px-2 text-center">
                      <span className="font-display text-lg font-bold text-brand-blue-light">3D</span>
                      <span className="line-clamp-2 text-[9px] text-brand-muted">{model.name}</span>
                      <button
                        type="button"
                        onClick={() => setModel(null)}
                        className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-[11px] text-white opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Текстовые поля — вручную */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field label="Категория *">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="input-base"
                >
                  {PRODUCT_CATEGORIES.map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Артикул *">
                <input value={article} onChange={(e) => setArticle(e.target.value)} required className="input-base" />
              </Field>

              <Field label="Название *" full>
                <input value={title} onChange={(e) => setTitle(e.target.value)} required className="input-base" />
              </Field>

              <Field label="Бренд">
                <input value={brand} onChange={(e) => setBrand(e.target.value)} className="input-base" />
              </Field>

              <Field label="Цена (₸) *">
                <input
                  type="number"
                  min={0}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                  className="input-base"
                />
              </Field>

              <Field label="Описание" full>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="input-base resize-none"
                />
              </Field>

              <Field label="Характеристики" full>
                <textarea
                  value={specs}
                  onChange={(e) => setSpecs(e.target.value)}
                  rows={3}
                  placeholder="Материал: латунь; Цвет: хром; Высота: 150 мм"
                  className="input-base resize-none"
                />
              </Field>
            </div>

            <div className="flex flex-wrap items-center gap-6">
              <label className="flex items-center gap-2 text-[13px] text-brand-ink">
                <input type="checkbox" checked={inStock} onChange={(e) => setInStock(e.target.checked)} />
                В наличии
              </label>
              <label className="flex items-center gap-2 text-[13px] text-brand-ink">
                <input type="checkbox" checked={social} onChange={(e) => setSocial(e.target.checked)} />
                Также черновиком в Instagram/Telegram
              </label>
            </div>

            <button
              type="submit"
              disabled={state === "loading"}
              data-cursor-magnetic
              className="font-mono-label rounded-full bg-brand-blue px-6 py-3.5 text-[12px] uppercase tracking-wide text-white transition-colors hover:bg-brand-blue-light disabled:opacity-50"
            >
              {state === "loading" ? "Загружаю..." : "Загрузить товар"}
            </button>

            {message && (
              <p
                className={`text-[13px] ${state === "error" ? "text-red-400" : "text-brand-blue-light"}`}
              >
                {message}
              </p>
            )}
          </form>
        </div>
      </main>

      <Footer rightText="© 2026 SANBAZAR — ВНУТРЕННИЙ ИНСТРУМЕНТ" />
    </>
  );
}

function Field({ label, full, children }: { label: string; full?: boolean; children: React.ReactNode }) {
  return (
    <label className={`flex flex-col gap-2 ${full ? "sm:col-span-2" : ""}`}>
      <span className="font-mono-label text-[10px] uppercase text-brand-muted">{label}</span>
      {children}
    </label>
  );
}
