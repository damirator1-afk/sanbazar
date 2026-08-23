import { groq } from "next-sanity";

export const PRODUCTS_BY_CATEGORY_QUERY = groq`
  *[_type == "product" && category == $category && hidden != true] | order(title asc) {
    _id,
    article,
    title,
    brand,
    price,
    inStock,
    description,
    specs,
    images,
    "modelUrl": model.asset->url
  }
`;

export interface RawProduct {
  _id: string;
  article: string;
  title: string;
  brand: string | null;
  price: number;
  inStock: boolean;
  description: string | null;
  specs: string | null;
  images: { asset?: { _ref: string } }[] | null;
  modelUrl: string | null;
}

export interface Product {
  id: string;
  article: string;
  title: string;
  brand: string | null;
  price: number;
  inStock: boolean;
  description: string | null;
  specs: string | null;
  imageUrl: string | null;
  modelUrl: string | null;
}
