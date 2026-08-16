import { MeshStandardMaterialParameters } from "three";

export const chromeMaterial: MeshStandardMaterialParameters = {
  color: "#e7ecf5",
  metalness: 1,
  roughness: 0.12,
  envMapIntensity: 1.4,
};

export const darkChromeMaterial: MeshStandardMaterialParameters = {
  color: "#8a94a8",
  metalness: 1,
  roughness: 0.22,
  envMapIntensity: 1.2,
};

export const ceramicMaterial: MeshStandardMaterialParameters = {
  color: "#f4f5f7",
  metalness: 0,
  roughness: 0.22,
  envMapIntensity: 0.9,
};

export const matteBlackMaterial: MeshStandardMaterialParameters = {
  // true near-black was disappearing entirely against the dark
  // background/fog — a dark charcoal still reads as "matte black metal"
  // but keeps enough form visible to be legible
  color: "#2a303a",
  metalness: 0.65,
  roughness: 0.5,
  envMapIntensity: 1.1,
};

export const pedestalMaterial: MeshStandardMaterialParameters = {
  color: "#171d28",
  metalness: 0.4,
  roughness: 0.6,
};
