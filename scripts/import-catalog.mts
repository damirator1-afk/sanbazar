/**
 * One-time (re-runnable) import: reads каталог/шаблон_каталога.xlsx +
 * каталог/фото/ and upserts each row as a `product` document in Sanity.
 *
 * Safe to re-run after the spreadsheet gets more rows or photos are
 * added — each product's Sanity document id is derived from its
 * "Артикул" (article), so re-running updates existing products instead
 * of duplicating them.
 *
 * Usage:  npm run import-catalog
 */

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";
import * as XLSX from "xlsx";
import { createClient } from "@sanity/client";
import { PRODUCT_CATEGORIES } from "../src/sanity/schemaTypes/product";
import { upsertSocialDraft } from "../src/lib/socialDraft";
import { optimizeModel } from "../src/lib/optimizeModel";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

loadEnv({ path: path.resolve(__dirname, "..", ".env.local") });

// website/scripts/ → ../.. → SanBazar/ → каталог/
const CATALOG_DIR = path.resolve(__dirname, "..", "..", "каталог");
const TEMPLATE_PATH = path.join(CATALOG_DIR, "шаблон_каталога.xlsx");
const PHOTOS_DIR = path.join(CATALOG_DIR, "фото");
const MODELS_DIR = path.join(CATALOG_DIR, "3D");

const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];
const MODEL_EXTENSIONS = [".glb", ".gltf"];

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
const token = process.env.SANITY_API_WRITE_TOKEN;

if (!projectId || !dataset || !token) {
  console.error(
    "Не хватает переменных окружения (NEXT_PUBLIC_SANITY_PROJECT_ID / NEXT_PUBLIC_SANITY_DATASET / SANITY_API_WRITE_TOKEN) — проверьте .env.local"
  );
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  token,
  apiVersion: "2024-01-01",
  useCdn: false,
});

// widened to `string` keys/values: at runtime this is looked up with an
// arbitrary cell value from the spreadsheet, not a known-good literal
const CATEGORY_TITLE_TO_KEY = new Map<string, string>(
  PRODUCT_CATEGORIES.map((c) => [c.title, c.key])
);

interface ProductRow {
  categoryTitle: string;
  article: string;
  title: string;
  brand: string;
  price: number;
  inStock: boolean;
  description: string;
  specs: string;
  social: boolean;
  // Необязательные колонки расписания публикации — если заполнены,
  // черновик в очереди публикаций создаётся сразу готовым (без захода в
  // Studio); см. upsertSocialDraft.
  publishAt?: string;
  format?: string;
  theme?: string;
  oldPrice?: number;
  promoText?: string;
  postText?: string;
}

// Ячейка с датой в Excel парсится библиотекой xlsx как JS Date, но с
// компонентами (год/месяц/день/час/минута) как они введены — трактуем их
// как локальное время Алматы (UTC+5) и переводим в UTC ISO для Sanity,
// как и исторический перенос очереди (migrate_queue_to_sanity.py).
const ALMATY_OFFSET_MS = 5 * 60 * 60 * 1000;

// publishJob.theme хранит значения "standard"/"premium" (см. schemaTypes/
// publishJob.ts), а в Excel владельцу удобнее писать по-русски
const THEME_MAP: Record<string, string> = {
  "стандарт": "standard",
  "standard": "standard",
  "премиум": "premium",
  "premium": "premium",
};

function parsePublishAt(raw: unknown): string | undefined {
  if (raw === undefined || raw === null || raw === "") return undefined;
  let y: number, mo: number, d: number, h: number, mi: number;
  if (raw instanceof Date) {
    // xlsx строит Date из серийного номера Excel через UTC-компоненты —
    // читаем их обратно через getUTC*, а не local-геттеры, иначе результат
    // зависел бы от часового пояса, в котором запущен этот скрипт
    y = raw.getUTCFullYear();
    mo = raw.getUTCMonth();
    d = raw.getUTCDate();
    h = raw.getUTCHours();
    mi = raw.getUTCMinutes();
  } else {
    const s = String(raw).trim();
    const m = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})(?:[ T](\d{1,2}):(\d{2}))?$/);
    if (!m) return undefined;
    d = Number(m[1]);
    mo = Number(m[2]) - 1;
    y = Number(m[3]);
    h = m[4] ? Number(m[4]) : 10;
    mi = m[5] ? Number(m[5]) : 0;
  }
  const almatyAsUtcMs = Date.UTC(y, mo, d, h, mi);
  return new Date(almatyAsUtcMs - ALMATY_OFFSET_MS).toISOString();
}

function readRows(): ProductRow[] {
  if (!existsSync(TEMPLATE_PATH)) {
    console.error(`Файл шаблона не найден: ${TEMPLATE_PATH}`);
    process.exit(1);
  }
  // XLSX.readFile isn't exposed via this package's ESM build — reading
  // the buffer ourselves and using XLSX.read works in any environment
  const buf = readFileSync(TEMPLATE_PATH);
  // cellDates: true — иначе ячейка "Дата публикации", отформатированная в
  // Excel как дата (а не введённая текстом), придёт числом (серийная дата
  // Excel), а не JS Date, и parsePublishAt тихо её пропустит
  const wb = XLSX.read(buf, { type: "buffer", cellDates: true });
  const sheet = wb.Sheets["Товары"];
  if (!sheet) {
    console.error('На листе "Товары" не найдены данные — проверьте имя листа в файле.');
    process.exit(1);
  }
  const raw: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
  const [, ...dataRows] = raw; // skip header row

  const rows: ProductRow[] = [];
  for (const r of dataRows) {
    const [
      category, article, title, brand, price, inStock, description, specs, social,
      publishAtRaw, format, theme, oldPrice, promoText, postText,
    ] = r as (string | number)[];
    if (!category && !article) continue; // blank trailing row
    rows.push({
      categoryTitle: String(category ?? "").trim(),
      article: String(article ?? "").trim(),
      title: String(title ?? "").trim(),
      brand: String(brand ?? "").trim(),
      price: Number(price) || 0,
      inStock: String(inStock ?? "").trim().toLowerCase() !== "нет",
      description: String(description ?? "").trim(),
      specs: String(specs ?? "").trim(),
      social: String(social ?? "").trim().toLowerCase() === "да",
      publishAt: parsePublishAt(publishAtRaw),
      format: String(format ?? "").trim() || undefined,
      theme: THEME_MAP[String(theme ?? "").trim().toLowerCase()] || undefined,
      oldPrice: oldPrice ? Number(oldPrice) || undefined : undefined,
      promoText: String(promoText ?? "").trim() || undefined,
      postText: String(postText ?? "").trim() || undefined,
    });
  }
  return rows;
}

function findPhotos(article: string): string[] {
  if (!existsSync(PHOTOS_DIR)) return [];
  const files = readdirSync(PHOTOS_DIR);
  const escaped = article.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // matches "ARTICLE.ext" or "ARTICLE_1.ext", "ARTICLE_2.ext", ...
  const re = new RegExp(`^${escaped}(?:_(\\d+))?\\.(${IMAGE_EXTENSIONS.map((e) => e.slice(1)).join("|")})$`, "i");
  return files
    .map((f) => {
      const m = f.match(re);
      return m ? { file: f, order: m[1] ? Number(m[1]) : 0 } : null;
    })
    .filter((x): x is { file: string; order: number } => x !== null)
    .sort((a, b) => a.order - b.order)
    .map((x) => path.join(PHOTOS_DIR, x.file));
}

function findModel(article: string): string | null {
  if (!existsSync(MODELS_DIR)) return null;
  const files = readdirSync(MODELS_DIR);
  const escaped = article.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`^${escaped}\\.(${MODEL_EXTENSIONS.map((e) => e.slice(1)).join("|")})$`, "i");
  const match = files.find((f) => re.test(f));
  return match ? path.join(MODELS_DIR, match) : null;
}

async function uploadModel(filePath: string) {
  const buffer = await optimizeModel(filePath);
  const filename = path.basename(filePath).replace(/\.(glb|gltf)$/i, ".glb");
  const asset = await client.assets.upload("file", buffer, {filename});
  return {
    _type: "file" as const,
    asset: { _type: "reference" as const, _ref: asset._id },
  };
}

async function uploadImages(article: string, files: string[]) {
  const refs = [];
  for (const filePath of files) {
    const buffer = readFileSync(filePath);
    const asset = await client.assets.upload("image", buffer, {
      filename: path.basename(filePath),
    });
    refs.push({
      _type: "image" as const,
      _key: `${article}-${refs.length}`,
      asset: { _type: "reference" as const, _ref: asset._id },
    });
  }
  return refs;
}

async function syncToSocialQueue(row: ProductRow, images: Awaited<ReturnType<typeof uploadImages>>) {
  const result = await upsertSocialDraft(client, {
    article: row.article,
    brand: row.brand,
    category: row.categoryTitle,
    price: row.price,
    specs: row.specs,
    images,
    publishAt: row.publishAt,
    format: row.format,
    theme: row.theme,
    oldPrice: row.oldPrice,
    promoText: row.promoText,
    postText: row.postText,
  });
  console.log(`  -> соцсети: ${result}`);
}

function slugifyId(article: string): string {
  // Sanity document ids only allow [a-zA-Z0-9._-]
  const cleaned = article.replace(/[^a-zA-Z0-9._-]/g, "-");
  return `product-${cleaned}`;
}

async function main() {
  const rows = readRows();
  console.log(`Найдено строк товаров: ${rows.length}\n`);

  let imported = 0;
  let skipped = 0;
  const warnings: string[] = [];

  for (const row of rows) {
    if (!row.article) {
      warnings.push(`Пропущена строка без артикула: "${row.title}"`);
      skipped++;
      continue;
    }
    if (!row.title) {
      warnings.push(`Пропущен артикул без названия: "${row.article}"`);
      skipped++;
      continue;
    }
    const categoryKey = CATEGORY_TITLE_TO_KEY.get(row.categoryTitle);
    if (!categoryKey) {
      warnings.push(
        `Артикул "${row.article}": неизвестная категория "${row.categoryTitle}" — пропущен`
      );
      skipped++;
      continue;
    }

    const photoFiles = findPhotos(row.article);
    if (photoFiles.length === 0) {
      warnings.push(`Артикул "${row.article}": фото не найдено (папка «фото»)`);
    }
    const modelFile = findModel(row.article);

    process.stdout.write(`Импорт: ${row.article} — ${row.title}...`);
    try {
      const images = photoFiles.length > 0 ? await uploadImages(row.article, photoFiles) : [];
      const model = modelFile ? await uploadModel(modelFile) : undefined;
      await client.createOrReplace({
        _id: slugifyId(row.article),
        _type: "product",
        category: categoryKey,
        article: row.article,
        title: row.title,
        brand: row.brand || undefined,
        price: row.price,
        inStock: row.inStock,
        description: row.description || undefined,
        specs: row.specs || undefined,
        images,
        model,
      });
      console.log(` OK (${photoFiles.length} фото${modelFile ? ", 3D-модель" : ""})`);
      imported++;

      if (row.social) {
        try {
          await syncToSocialQueue(row, images);
        } catch (err) {
          warnings.push(`Артикул "${row.article}": не удалось добавить в очередь соцсетей — ${(err as Error).message}`);
        }
      }
    } catch (err) {
      console.log(" ОШИБКА");
      warnings.push(`Артикул "${row.article}": ${(err as Error).message}`);
      skipped++;
    }
  }

  console.log(`\nГотово: импортировано ${imported}, пропущено ${skipped}.`);
  if (warnings.length > 0) {
    console.log("\nПредупреждения:");
    warnings.forEach((w) => console.log("  - " + w));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
