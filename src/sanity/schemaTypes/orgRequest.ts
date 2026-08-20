import { defineField, defineType } from "sanity";

// Created by the "Для организаций" form (src/app/organizations/page.tsx via
// /api/org-request). Picked up and processed by the local Telegram bot
// (Автоматизация/scripts, polling this doc type) — see project root
// SanBazar/Автоматизация/CLAUDE.md for the КП-generation side.
export const orgRequest = defineType({
  name: "orgRequest",
  title: "Заявка от организации (КП)",
  type: "document",
  fields: [
    defineField({
      name: "companyName",
      title: "Компания",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "contactEmail",
      title: "Email для отправки КП",
      type: "string",
      validation: (rule) => rule.required().email(),
    }),
    defineField({
      name: "contactPhone",
      title: "Телефон",
      type: "string",
    }),
    defineField({
      name: "items",
      title: "Позиции",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            defineField({ name: "article", title: "Артикул", type: "string" }),
            defineField({ name: "title", title: "Наименование", type: "string" }),
            defineField({ name: "unit", title: "Ед.", type: "string", initialValue: "шт" }),
            defineField({ name: "qty", title: "Кол-во", type: "number" }),
            defineField({ name: "price", title: "Цена", type: "number" }),
          ],
        },
      ],
    }),
    defineField({
      name: "status",
      title: "Статус",
      type: "string",
      options: { list: ["pending", "sent", "error"] },
      initialValue: "pending",
    }),
    defineField({
      name: "errorMessage",
      title: "Ошибка (если статус error)",
      type: "text",
      rows: 2,
    }),
  ],
  preview: {
    select: { title: "companyName", subtitle: "contactEmail", status: "status" },
    prepare({ title, subtitle, status }) {
      return { title: `${title} — ${status}`, subtitle };
    },
  },
});
