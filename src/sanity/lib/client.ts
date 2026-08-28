import { createClient } from 'next-sanity'

import { apiVersion, dataset, projectId } from '../env'

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  // CDN-кэш Sanity держит ответы до ~60 сек — из-за этого правки владельца
  // в Studio (напр. галочка "Скрыт с сайта") казались "работающими через
  // раз" на живом сайте. false — всегда свежие данные напрямую из Sanity.
  useCdn: false,
  // Датасет приватный (не "public") — без токена GROQ-запросы вернут
  // пусто. Этот файл импортируется только из серверных компонентов
  // (страница категории и т.п.), токен в браузер не попадает.
  token: process.env.SANITY_API_WRITE_TOKEN,
})
