import { type SchemaTypeDefinition } from 'sanity'
import { product } from './product'
import { orgRequest } from './orgRequest'
import { publishJob } from './publishJob'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [product, orgRequest, publishJob],
}
