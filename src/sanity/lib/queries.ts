import { groq } from "next-sanity";

const ANALOG_PROJECTION = groq`
  _id,
  article,
  title,
  brand,
  price,
  inStock,
  hidden,
  images,
  "modelUrl": model.asset->url
`;

export const PRODUCTS_BY_CATEGORY_QUERY = groq`
  *[_type == "product" && category == $category && hidden != true] | order(title asc) {
    _id,
    article,
    title,
    brand,
    subcategory,
    price,
    inStock,
    description,
    specs,
    images,
    "modelUrl": model.asset->url,
    "analogs": analogs[]->{ ${ANALOG_PROJECTION} }
  }
`;

export interface RawAnalog {
  _id: string;
  article: string;
  title: string;
  brand: string | null;
  price: number;
  inStock: boolean;
  hidden: boolean | null;
  images: { asset?: { _ref: string } }[] | null;
  modelUrl: string | null;
}

export interface RawProduct {
  _id: string;
  article: string;
  title: string;
  brand: string | null;
  subcategory: string | null;
  price: number;
  inStock: boolean;
  description: string | null;
  specs: string | null;
  images: { asset?: { _ref: string } }[] | null;
  modelUrl: string | null;
  analogs: RawAnalog[] | null;
}

export interface AnalogProduct {
  id: string;
  article: string;
  title: string;
  brand: string | null;
  price: number;
  inStock: boolean;
  imageUrl: string | null;
  modelUrl: string | null;
}

export interface Product {
  id: string;
  article: string;
  title: string;
  brand: string | null;
  subcategory: string | null;
  price: number;
  inStock: boolean;
  description: string | null;
  specs: string | null;
  imageUrl: string | null;
  modelUrl: string | null;
  analogs: AnalogProduct[];
}
