import type { Product } from "./seedData";

export function isProductEligibleForMaryBosquesPromo(product: Product): boolean {
  const isMaryBosques = /bosque/i.test(product.brand);
  if (!isMaryBosques) return false;

  const excludedNames = [
    "argan express",
    "keratina express",
    "emulsion hidratante"
  ];

  const normalize = (str: string) => 
    str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const nameNormalized = normalize(product.name);
  const isExcluded = excludedNames.some(excluded => nameNormalized.includes(excluded));

  return !isExcluded;
}
