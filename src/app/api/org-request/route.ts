import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@sanity/client";

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  token: process.env.SANITY_API_WRITE_TOKEN,
  apiVersion: "2024-01-01",
  useCdn: false,
});

interface OrgRequestItem {
  article: string;
  title: string;
  price: number;
  qty: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const companyName = String(body.companyName || "").trim();
    const contactEmail = String(body.contactEmail || "").trim();
    const contactPhone = String(body.contactPhone || "").trim();
    const items: OrgRequestItem[] = Array.isArray(body.items) ? body.items : [];

    if (!companyName || !contactEmail || items.length === 0) {
      return NextResponse.json(
        { error: "Укажите компанию, email и хотя бы один товар" },
        { status: 400 }
      );
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      return NextResponse.json({ error: "Некорректный email" }, { status: 400 });
    }

    // Picked up by the local bot (Автоматизация/scripts) polling this doc
    // type — it builds the branded КП and emails it to contactEmail
    // directly, then flips status to "sent". See SanBazar/Автоматизация/CLAUDE.md.
    const doc = await client.create({
      _type: "orgRequest",
      companyName,
      contactEmail,
      contactPhone: contactPhone || undefined,
      items: items.map((it) => ({
        _type: "object" as const,
        _key: it.article || it.title,
        article: it.article,
        title: it.title,
        unit: "шт",
        qty: it.qty,
        price: it.price,
      })),
      status: "pending",
    });

    return NextResponse.json({ success: true, id: doc._id });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
