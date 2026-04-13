import type { Product } from "./seedData";

export function isProductEligibleForMaryBosquesPromo(product: Product): boolean {
  const isMaryBosques = /bosque/i.test(product.brand);
  if (!isMaryBosques) return false;

  // Productos excluidos de la promoción 2 x $13.000
  const excludedNames = [
    "argán express",
    "keratina express",
    "emulsión hidratante"
  ];

  const nameLower = product.name.toLowerCase();
  const isExcluded = excludedNames.some(excluded => nameLower.includes(excluded));

  return !isExcluded;
}
