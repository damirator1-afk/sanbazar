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
  { key: "accessories", title: "Комплектующие" },
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
      description: "Если снять — товар остаётся на сайте, но с пометкой «Под заказ».",
      initialValue: true,
    }),
    defineField({
      name: "hidden",
      title: "Скрыт с сайта",
      type: "boolean",
      description: "Если включить — товар полностью пропадает с сайта (каталог, категории), но остаётся в Sanity. Для товаров, временно выведенных из ассортимента (не для банального «нет в наличии» — для этого есть «В наличии»).",
      initialValue: false,
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
    defineField({
      name: "video",
      title: "Видео",
      description: "Необязательно — для будущего использования на карточке товара (сейчас не отображается на сайте, только хранится).",
      type: "file",
      options: { accept: ".mp4,.mov" },
    }),
    defineField({
      name: "analogs",
      title: "Аналоги",
      description: "Заполнять только у ходовых товаров с прямыми аналогами других брендов (напр. K828 ↔ T828). Ссылку нужно проставить с обеих сторон — она не подставляется автоматически.",
      type: "array",
      of: [
        {
          type: "reference",
          to: [{ type: "product" }],
          options: {
            filter: ({ document }) => ({
              filter: "_id != $selfId",
              params: { selfId: (document._id as string).replace(/^drafts\./, "") },
            }),
          },
        },
      ],
    }),
  ],
  preview: {
    select: { title: "title", subtitle: "article", media: "images.0", hidden: "hidden" },
    prepare({ title, subtitle, media, hidden }) {
      return { title, subtitle: hidden ? `${subtitle} · скрыт с сайта` : subtitle, media };
    },
  },
});
