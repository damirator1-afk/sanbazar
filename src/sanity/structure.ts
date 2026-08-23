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
      S.listItem()
        .title('Товары')
        .child(
          S.list()
            .title('Товары')
            .items([
              S.listItem().title('Все товары').child(S.documentTypeList('product').title('Все товары')),
              S.listItem()
                .title('По брендам')
                .child(async (_itemId, context) => {
                  const client = context.structureContext.getClient({apiVersion: '2024-01-01'})
                  const brands: string[] = await client.fetch(
                    `array::unique(*[_type == "product" && defined(brand) && brand != ""].brand)`
                  )
                  return S.list()
                    .title('По брендам')
                    .items(
                      brands
                        .sort((a, b) => a.localeCompare(b, 'ru'))
                        .map((brand) =>
                          S.listItem()
                            .title(brand)
                            .child(
                              S.documentList()
                                .title(brand)
                                .filter('_type == "product" && brand == $brand')
                                .params({brand})
                            )
                        )
                    )
                }),
            ])
        ),
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
