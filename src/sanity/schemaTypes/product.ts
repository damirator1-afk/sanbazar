import { defineField, defineType } from "sanity";

// Mirrors src/lib/categories.ts CATEGORIES — kept as a plain literal list
// here (rather than importing that file) because it uses `three`, which
// has no business being pulled into the Sanity Studio bundle.
export const PRODUCT_CATEGORIES = [
  { key: "faucet", title: "Смесители" },
  { key: "toilet", title: "Санфаянс" },
  { key: "shower", title: "Душевые системы" },
  { key: "installation", title: "Инсталляции" },
  { key: "siphon", title: "Сифоны" },
  { key: "accessories", title: "Аксессуары" },
] as const;

export const product = defineType({
  name: "product",
  title: "Товар",
  type: "document",
  fields: [
    defineField({
      name: "category",
      title: "Категория",
      type: "string",
      options: {
        list: PRODUCT_CATEGORIES.map((c) => ({ title: c.title, value: c.key })),
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "article",
      title: "Артикул",
      type: "string",
      description: "Должен быть уникальным — используется и для сопоставления фото при импорте.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "title",
      title: "Название",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "brand",
      title: "Бренд",
      type: "string",
    }),
    defineField({
      name: "price",
      title: "Цена",
      type: "number",
      validation: (rule) => rule.required().min(0),
    }),
    defineField({
      name: "inStock",
      title: "В наличии",
      type: "boolean",
      initialValue: true,
    }),
    defineField({
      name: "description",
      title: "Описание",
      type: "text",
      rows: 4,
    }),
    defineField({
      name: "specs",
      title: "Характеристики",
      type: "text",
      rows: 3,
      description: "Свободный текст, например: Материал: латунь; Цвет: хром; Высота: 150 мм",
    }),
    defineField({
      name: "images",
      title: "Фото",
      type: "array",
      of: [{ type: "image", options: { hotspot: true } }],
    }),
    defineField({
      name: "model",
      title: "3D-модель",
      type: "file",
      description: "Файл .glb/.gltf (напр. экспорт из Tripo3D) — показывается как вращаемая 3D-модель вместо фото.",
      options: { accept: ".glb,.gltf" },
    }),
  ],
  preview: {
    select: { title: "title", subtitle: "article", media: "images.0" },
  },
});
