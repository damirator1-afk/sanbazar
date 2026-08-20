import { type SchemaTypeDefinition } from 'sanity'
import { product } from './product'
import { orgRequest } from './orgRequest'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [product, orgRequest],
}
