import { Search, Tag } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import type { Product } from "@/lib/seedData";
import { isProductEligibleForMaryBosquesPromo } from "@/lib/promoUtils";


interface FilterBarProps {
  products: Product[];
  onFilter: (filtered: Product[]) => void;
  promoOnly: boolean;
  setPromoOnly: (val: boolean) => void;
}

export default function FilterBar({ products, onFilter, promoOnly, setPromoOnly }: FilterBarProps) {
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const brands = useMemo(() => {
    const set = new Set(products.map((p) => p.brand));
    return Array.from(set).sort();
  }, [products]);

  useEffect(() => {
    let result = [...products];
    
    // Si hay marcas seleccionadas, filtramos por ellas
    if (selectedBrands.length > 0) {
      result = result.filter((p) => selectedBrands.includes(p.brand));
    }
    
    if (promoOnly) {
      result = result.filter((p) => {
        const isMaryBosques = /bosque/i.test(p.brand);
        if (isMaryBosques) {
          // Aparece en Ofertas si es parte de la promo 2x13000 O si tiene un descuento individual
          return isProductEligibleForMaryBosquesPromo(p) || p.discountPrice !== null;
        }
        // Para otras marcas, aparece si tiene precio de descuento
        return p.discountPrice !== null;
      });
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
  }, [selectedBrands, promoOnly, debouncedSearch, products, onFilter]);

  const toggleBrand = (brand: string) => {
    // Si seleccionamos una marca, quitamos el filtro de Ofertas
    setPromoOnly(false);
    
    setSelectedBrands((prev) => 
      prev.includes(brand) 
        ? prev.filter(b => b !== brand) 
        : [...prev, brand]
    );
  };

  const handlePromoToggle = () => {
    const newValue = !promoOnly;
    setPromoOnly(newValue);
    if (newValue) {
      // Si activamos ofertas, quitamos las marcas seleccionadas
      setSelectedBrands([]);
    }
  };

  const clearAllBrands = () => {
    setSelectedBrands([]);
    setPromoOnly(false);
  };

  const activeFiltersCount =
    (selectedBrands.length) +
    (promoOnly ? 1 : 0) +
    (debouncedSearch.trim() ? 1 : 0);

  return (
    <div id="productos" className="sticky top-[57px] z-40 bg-background/95 backdrop-blur-sm border-b border-border py-4">
      <div className="container mx-auto px-4 space-y-4">
        <div className="flex flex-wrap items-center gap-2 pb-1">
          {/* BOTÓN OFERTAS DESTACADO */}
          <button
            onClick={handlePromoToggle}
            className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 shadow-sm border-2 transform hover:scale-105 active:scale-95 ${
              promoOnly
                ? "bg-orange-600 text-white border-orange-700 ring-2 ring-orange-500/30 shadow-inner"
                : "bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100"
            }`}
          >
            <Tag className={`w-4 h-4 ${promoOnly ? "animate-bounce" : ""}`} />
            OFERTAS
          </button>

          <div className="h-6 w-[1px] bg-border mx-1" />

          {/* BOTÓN TODAS */}
          <button
            onClick={clearAllBrands}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors shadow-sm border ${
              selectedBrands.length === 0 && !promoOnly
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-muted text-muted-foreground border-transparent hover:bg-muted/80"
            }`}
          >
            Todas
          </button>

          {/* BOTONES DE MARCAS */}
          {brands.map((brand) => (
            <button
              key={brand}
              onClick={() => toggleBrand(brand)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all shadow-sm border ${
                selectedBrands.includes(brand)
                  ? "bg-primary text-primary-foreground border-primary ring-2 ring-primary/10"
                  : "bg-muted text-muted-foreground border-transparent hover:bg-muted/80"
              }`}
            >
              {brand}
            </button>
          ))}
          
          {activeFiltersCount > 0 && (
            <span className="bg-accent text-accent-foreground text-xs font-bold rounded-full min-w-6 h-6 px-1.5 flex items-center justify-center flex-shrink-0 animate-in zoom-in shadow-sm">
              {activeFiltersCount}
            </span>
          )}
        </div>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por nombre, marca o descripción..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 rounded-full bg-muted/50 border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-accent transition-all"
          />
        </div>
      </div>
    </div>
  );
}
