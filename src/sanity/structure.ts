import type {StructureResolver} from 'sanity/structure'

// https://www.sanity.io/docs/structure-builder-cheat-sheet
//
// «Публикации» разбиты на подсписки по статусу (Instagram/Telegram
// независимы друг от друга, поэтому фильтры не строго взаимоисключающие —
// это ок, они для удобства навигации, а не формальное разбиение).
const publishJobBuckets = [
  {
    title: 'Черновики',
    filter: '_type == "publishJob" && (instagramStatus == "черновик" || telegramStatus == "черновик")',
  },
  {
    title: 'Ошибки',
    filter: '_type == "publishJob" && (instagramStatus == "ошибка" || telegramStatus == "ошибка")',
  },
  {
    title: 'Ждут публикации',
    filter: '_type == "publishJob" && (instagramStatus in ["ожидает", "в очереди"] || telegramStatus == "ожидает")',
  },
  {
    title: 'Опубликовано',
    filter:
      '_type == "publishJob" && (instagramStatus in ["опубликовано", "опубликовано вручную"] || telegramStatus == "опубликовано")',
  },
  {
    title: 'Все публикации',
    filter: '_type == "publishJob"',
  },
]

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      S.documentTypeListItem('product').title('Товары'),
      S.listItem()
        .title('Публикации (Instagram/Telegram)')
        .child(
          S.list()
            .title('Публикации (Instagram/Telegram)')
            .items(
              publishJobBuckets.map((bucket) =>
                S.listItem()
                  .title(bucket.title)
                  .child(
                    S.documentList()
                      .title(bucket.title)
                      .filter(bucket.filter)
                      .defaultOrdering([{field: 'publishAt', direction: 'desc'}])
                  )
              )
            )
        ),
      S.documentTypeListItem('orgRequest').title('Заявки от организаций (КП)'),
    ])
