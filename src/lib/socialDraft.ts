import type { SanityClient } from "@sanity/client";

// Черновик очереди Instagram/Telegram (publishJob) — используется, когда у
// товара в каталоге/форме загрузки стоит «Соцсети» = Да. Переиспользует уже
// загруженные для товара картинки/видео (без повторной загрузки файлов) и
// пишет напрямую в Sanity — раньше это делал sync_from_catalog.py через
// execFileSync("python", ...), который работал только на компьютере
// владельца (на Vercel Python недоступен). Теперь работает одинаково и
// локально, и на sanbazar.com.

interface ImageRef {
  _type: "image";
  _key: string;
  asset: { _type: "reference"; _ref: string };
}

interface FileRef {
  _type: "file";
  asset: { _type: "reference"; _ref: string };
}

export interface SocialDraftParams {
  article: string;
  brand?: string;
  category?: string;
  price?: number;
  specs?: string;
  images: ImageRef[];
  video?: FileRef;
  // Необязательные поля расписания публикации (напр. из дополнительных
  // колонок каталога) — заполняются только при СОЗДАНИИ нового черновика.
  // На уже существующий publishJob они никогда не влияют, даже если при
  // повторном импорте эти колонки заполнены — дату/формат/статус мог
  // поменять владелец вручную в Studio, перезаписывать нельзя.
  publishAt?: string; // ISO 8601 (UTC)
  format?: string;
  theme?: string;
  oldPrice?: number;
  promoText?: string;
  postText?: string;
}

function slugifyId(article: string): string {
  const cleaned = article.replace(/[^a-zA-Z0-9._-]/g, "-");
  return `publishJob-${cleaned}`;
}

export async function upsertSocialDraft(client: SanityClient, params: SocialDraftParams): Promise<string> {
  const id = slugifyId(params.article);
  const photos = params.images.map((img, i) => ({ ...img, _key: `photo-${i}` }));
  const existing = await client.getDocument(id);

  if (existing) {
    // не трогаем дату публикации/тему/акцию/статус — их мог заполнить или
    // поменять владелец вручную в Studio
    const patch: Record<string, unknown> = {
      brand: params.brand || undefined,
      category: params.category || undefined,
      specs: params.specs || undefined,
      price: params.price,
    };
    if (photos.length > 0) patch.photos = photos;
    if (params.video) patch.video = params.video;
    await client.patch(id).set(patch).commit();
    return `updated:${params.article}`;
  }

  // если дата публикации указана прямо в каталоге — черновик сразу готов
  // к автоматической публикации (статус "ожидает"), Studio не нужна;
  // без даты — обычный черновик, как раньше, дозаполняется вручную
  const ready = Boolean(params.publishAt);

  await client.create({
    _id: id,
    _type: "publishJob",
    article: params.article,
    brand: params.brand || undefined,
    category: params.category || undefined,
    specs: params.specs || undefined,
    price: params.price,
    oldPrice: params.oldPrice,
    promoText: params.promoText || undefined,
    postText: params.postText || undefined,
    publishAt: params.publishAt,
    format: params.format || "карусель",
    theme: params.theme || "standard",
    photos,
    video: params.video,
    instagramStatus: ready ? "ожидает" : "черновик",
    telegramStatus: ready ? "ожидает" : "черновик",
  });
  return `created:${params.article}`;
}
