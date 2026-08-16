import { ComponentType } from "react";
import { ModelKey } from "@/lib/categories";
import Faucet from "./Faucet";
import Toilet from "./Toilet";
import Shower from "./Shower";
import Installation from "./Installation";
import Siphon from "./Siphon";
import Accessories from "./Accessories";

export const PRODUCT_COMPONENTS: Record<ModelKey, ComponentType> = {
  faucet: Faucet,
  toilet: Toilet,
  shower: Shower,
  installation: Installation,
  siphon: Siphon,
  accessories: Accessories,
};
