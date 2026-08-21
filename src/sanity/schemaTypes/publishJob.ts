import { defineField, defineType } from "sanity";

// Очередь публикаций в Instagram/Telegram (@sanbazar_aktobe). Заменяет
// прежний "Лист Microsoft Excel.xlsx" + локальную папку bot/photos/ —
// теперь фото/видео и статусы публикации хранятся здесь, в Sanity, поэтому
// боту на сервере (Автоматизация/bot, VM sanbazar-bot) не нужна ручная
// синхронизация файлов с локального компьютера. Обрабатывается
// Инстаграмм/bot/publish_queue.py (poll по statusу, аналогично orgRequest).
export const publishJob = defineType({
  name: "publishJob",
  title: "Публикация (Instagram/Telegram)",
  type: "document",
  fields: [
    defineField({
      name: "publishAt",
      title: "Дата публикации",
      type: "datetime",
      description: "Instagram: публикуется в это время (дата должна быть в будущем на момент постановки в очередь). Telegram: публикуется, как только эта дата/время наступит.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "brand",
      title: "Бренд",
      type: "string",
    }),
    defineField({
      name: "article",
      title: "Артикул",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "category",
      title: "Категория",
      type: "string",
    }),
    defineField({
      name: "format",
      title: "Формат",
      type: "string",
      options: { list: ["карусель", "пост", "совет"] },
      initialValue: "карусель",
    }),
    defineField({
      name: "theme",
      title: "Тема оформления",
      type: "string",
      options: { list: [{ title: "Стандарт", value: "standard" }, { title: "Премиум", value: "premium" }] },
      initialValue: "standard",
    }),
    defineField({
      name: "specs",
      title: "Характеристики",
      type: "text",
      rows: 4,
    }),
    defineField({
      name: "price",
      title: "Цена",
      type: "number",
    }),
    defineField({
      name: "oldPrice",
      title: "Цена до скидки",
      type: "number",
    }),
    defineField({
      name: "promoText",
      title: "Акция",
      type: "string",
    }),
    defineField({
      name: "postText",
      title: "Текст поста",
      description: "Для формата «совет» или анонсов не про конкретный товар — заменяет автособираемую подпись.",
      type: "text",
      rows: 4,
    }),
    defineField({
      name: "photos",
      title: "Фото",
      type: "array",
      of: [{ type: "image" }],
    }),
    defineField({
      name: "video",
      title: "Видео",
      description: "Если заполнено — публикуется как видео вместо генерации карусели из фото.",
      type: "file",
      options: { accept: ".mp4,.mov" },
    }),
    defineField({
      name: "instagramStatus",
      title: "Статус (Instagram)",
      type: "string",
      description: "«Черновик» — публикация не трогает эту запись, пока дата не заполнена и статус не изменён вручную.",
      options: { list: ["черновик", "ожидает", "в очереди", "опубликовано", "опубликовано вручную", "ошибка"] },
      initialValue: "ожидает",
    }),
    defineField({
      name: "instagramResult",
      title: "Результат (Instagram)",
      type: "text",
      rows: 2,
    }),
    defineField({
      name: "telegramStatus",
      title: "Статус (Telegram)",
      type: "string",
      options: { list: ["черновик", "ожидает", "опубликовано", "ошибка"] },
      initialValue: "ожидает",
    }),
    defineField({
      name: "telegramResult",
      title: "Результат (Telegram)",
      type: "text",
      rows: 2,
    }),
  ],
  preview: {
    select: { title: "article", subtitle: "publishAt", igStatus: "instagramStatus", tgStatus: "telegramStatus", media: "photos.0" },
    prepare({ title, subtitle, igStatus, tgStatus, media }) {
      return {
        title,
        subtitle: `${subtitle ? new Date(subtitle).toLocaleString("ru-RU") : ""} · IG: ${igStatus || "—"} · TG: ${tgStatus || "—"}`,
        media,
      };
    },
  },
});
