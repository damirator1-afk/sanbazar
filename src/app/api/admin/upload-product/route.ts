import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@sanity/client";
import { upsertSocialDraft } from "@/lib/socialDraft";
import { isAdminAuthorized } from "@/lib/adminAuth";

export const runtime = "nodejs";

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  token: process.env.SANITY_API_WRITE_TOKEN,
  apiVersion: "2024-01-01",
  useCdn: false,
});

function slugifyId(article: string): string {
  const cleaned = article.replace(/[^a-zA-Z0-9._-]/g, "-");
  return `product-${cleaned}`;
}

export async function POST(request: NextRequest) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 });
  }

  try {
    const form = await request.formData();

    const category = String(form.get("category") || "").trim();
    const categoryTitle = String(form.get("categoryTitle") || "").trim();
    const article = String(form.get("article") || "").trim();
    const title = String(form.get("title") || "").trim();
    const brand = String(form.get("brand") || "").trim();
    const price = Number(form.get("price") || 0);
    const inStock = form.get("inStock") === "true";
    const description = String(form.get("description") || "").trim();
    const specs = String(form.get("specs") || "").trim();
    const social = form.get("social") === "true";

    if (!category || !article || !title || !price) {
      return NextResponse.json(
        { error: "Заполните обязательные поля: категория, артикул, название, цена" },
        { status: 400 }
      );
    }

    const photoFiles = form.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
    const videoEntry = form.get("video");
    const videoFile = videoEntry instanceof File && videoEntry.size > 0 ? videoEntry : null;
    const modelEntry = form.get("model");
    const modelFile = modelEntry instanceof File && modelEntry.size > 0 ? modelEntry : null;

    const images = [];
    for (const file of photoFiles) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const asset = await client.assets.upload("image", buffer, { filename: file.name });
      images.push({
        _type: "image" as const,
        _key: `${article}-${images.length}`,
        asset: { _type: "reference" as const, _ref: asset._id },
      });
    }

    let model = undefined;
    if (modelFile) {
      // Загружается как есть, без сжатия геометрии — в отличие от
      // import-catalog.mts (см. src/lib/optimizeModel.ts), этот роут
      // выполняется в serverless-окружении Vercel, где нельзя надёжно
      // шелльнуться в CLI-тул. Тяжёлые модели (напр. из Tripo AI) лучше
      // сжимать локально перед загрузкой через эту форму.
      const buffer = Buffer.from(await modelFile.arrayBuffer());
      const asset = await client.assets.upload("file", buffer, { filename: modelFile.name });
      model = { _type: "file" as const, asset: { _type: "reference" as const, _ref: asset._id } };
    }

    await client.createOrReplace({
      _id: slugifyId(article),
      _type: "product",
      category,
      article,
      title,
      brand: brand || undefined,
      price,
      inStock,
      description: description || undefined,
      specs: specs || undefined,
      images,
      model,
    });

    let socialResult: string | null = null;
    if (social) {
      let video = undefined;
      if (videoFile) {
        const buffer = Buffer.from(await videoFile.arrayBuffer());
        const asset = await client.assets.upload("file", buffer, { filename: videoFile.name });
        video = { _type: "file" as const, asset: { _type: "reference" as const, _ref: asset._id } };
      }
      try {
        socialResult = await upsertSocialDraft(client, {
          article,
          brand,
          category: categoryTitle,
          price,
          specs,
          images,
          video,
        });
      } catch (err) {
        // don't let a failed *optional* draft step erase a product that
        // already saved to Sanity successfully above
        socialResult = `Товар сохранён, но черновик в Instagram/Telegram не удался: ${(err as Error).message}`;
      }
    }

    return NextResponse.json({ success: true, id: slugifyId(article), social: socialResult });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
