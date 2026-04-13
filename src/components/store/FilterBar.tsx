import { Search, Tag } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import type { Product } from "@/lib/seedData";

interface FilterBarProps {
  products: Product[];
  onFilter: (filtered: Product[]) => void;
  promoOnly: boolean;
  setPromoOnly: (val: boolean) => void;
}

export default function FilterBar({ products, onFilter, promoOnly, setPromoOnly }: FilterBarProps) {
  const [selectedBrand, setSelectedBrand] = useState("Todas");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const brands = useMemo(() => {
    const set = new Set(products.map((p) => p.brand));
    return ["Todas", ...Array.from(set).sort()];
  }, [products]);

  useEffect(() => {
    let result = [...products];
    if (selectedBrand !== "Todas") {
      result = result.filter((p) => p.brand === selectedBrand);
    }
    if (promoOnly) {
      result = result.filter(
        (p) => 
          p.discountPrice !== null || 
          /mary\s+bosques/i.test(p.brand)
      );
    }
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }
    onFilter(result);
  }, [selectedBrand, promoOnly, debouncedSearch, products, onFilter]);

  const activeFilters =
    (selectedBrand !== "Todas" ? 1 : 0) +
    (promoOnly ? 1 : 0) +
    (debouncedSearch ? 1 : 0);

  return (
    <div id="productos" className="sticky top-[57px] z-40 bg-background/95 backdrop-blur-sm border-b border-border py-3">
      <div className="container mx-auto px-4 space-y-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {brands.map((brand) => (
            <button
              key={brand}
              onClick={() => setSelectedBrand(brand)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedBrand === brand
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {brand}
            </button>
          ))}
          <button
            onClick={() => setPromoOnly(!promoOnly)}
            className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1 ${
              promoOnly
                ? "bg-accent text-accent-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            Ofertas
          </button>
          {activeFilters > 0 && (
            <span className="bg-accent text-accent-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
              {activeFilters}
            </span>
          )}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por nombre, marca o descripción..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-full bg-muted border-0 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
      </div>
    </div>
  );
}
