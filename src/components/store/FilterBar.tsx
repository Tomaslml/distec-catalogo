import { Search, Tag } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import type { Product } from "@/lib/seedData";
import { isProductEligibleForMaryBosquesPromo } from "@/lib/promoUtils";


interface FilterBarProps {
  products: Product[];
  onFilter: (filtered: Product[]) => void;
  promoOnly: boolean;
  setPromoOnly: (val: boolean) => void;
  maryBosquesOnly: boolean;
  setMaryBosquesOnly: (val: boolean) => void;
}

export default function FilterBar({ 
  products, 
  onFilter, 
  promoOnly, 
  setPromoOnly,
  maryBosquesOnly,
  setMaryBosquesOnly
}: FilterBarProps) {
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
    
    // 1. Filtro de Bsqueda (siempre se aplica si hay texto)
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }

    // 2. Filtro especial Promo Hero (Mary Bosques Doypacks)
    if (maryBosquesOnly) {
      result = result.filter((p) => isProductEligibleForMaryBosquesPromo(p));
    }
    
    // 3. Filtro de Ofertas Generales
    else if (promoOnly) {
      result = result.filter((p) => {
        const isMaryBosques = /bosque/i.test(p.brand);
        if (isMaryBosques) {
          // Aparece en Ofertas si es parte de la promo 2x13000 O si tiene un descuento individual
          return isProductEligibleForMaryBosquesPromo(p) || p.discountPrice !== null;
        }
        return p.discountPrice !== null;
      });
    }
    
    // 4. Filtro de Marcas
    else if (selectedBrands.length > 0) {
      result = result.filter((p) => selectedBrands.includes(p.brand));
    }

    onFilter(result);
  }, [selectedBrands, promoOnly, maryBosquesOnly, debouncedSearch, products, onFilter]);

  const toggleBrand = (brand: string) => {
    // Si seleccionamos una marca, quitamos los filtros de Ofertas y Promo Hero
    setPromoOnly(false);
    setMaryBosquesOnly(false);
    
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
      // Si activamos ofertas, quitamos las marcas y la promo hero
      setSelectedBrands([]);
      setMaryBosquesOnly(false);
    }
  };

  const clearAllBrands = () => {
    setSelectedBrands([]);
    setPromoOnly(false);
    setMaryBosquesOnly(false);
  };

  const [showBrands, setShowBrands] = useState(false);

  const activeFiltersCount =
    (selectedBrands.length) +
    (promoOnly ? 1 : 0) +
    (maryBosquesOnly ? 1 : 0) +
    (debouncedSearch.trim() ? 1 : 0);

  return (
    <div id="productos" className="sticky top-[57px] z-40 bg-background/95 backdrop-blur-sm border-b border-border py-4">
      <div className="container mx-auto px-4 space-y-4">
        <div className="flex flex-wrap items-center gap-3 pb-1">
          {/* BOTÓN OFERTAS (Lo mantenemos afuera para que destaque, pero agrupado si prefieres) */}
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

          <div className="h-6 w-[1px] bg-border mx-1 hidden sm:block" />

          {/* BOTÓN DESPLEGABLE DE MARCAS */}
          <div className="relative">
            <button
              onClick={() => setShowBrands(!showBrands)}
              className={`whitespace-nowrap px-6 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 shadow-sm border-2 ${
                selectedBrands.length > 0
                  ? "bg-primary text-primary-foreground border-primary ring-2 ring-primary/20"
                  : "bg-white text-foreground border-border hover:bg-muted"
              }`}
            >
              <span>Filtrar por marca</span>
            </button>

            {/* LISTA DESPLEGABLE (Dropdown) */}
            {showBrands && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowBrands(false)} 
                />
                <div className="absolute left-0 mt-2 w-52 bg-card border border-border rounded-2xl shadow-xl z-20 overflow-hidden animate-in fade-in zoom-in duration-200">
                  <div className="p-2 border-b border-border bg-muted/30 flex items-center justify-between">
                    <span className="text-[10px] font-bold px-1 text-muted-foreground uppercase tracking-wider">Marcas</span>
                    <button 
                      onClick={clearAllBrands}
                      className="text-[9px] font-black text-accent hover:bg-accent/10 py-1 px-2 rounded-lg border border-accent/20 transition-colors"
                    >
                      LIMPIAR
                    </button>
                  </div>
                  <div className="max-h-64 overflow-y-auto p-1 scrollbar-thin">
                    {brands.map((brand) => (
                      <button
                        key={brand}
                        onClick={() => toggleBrand(brand)}
                        className={`w-full text-left px-3 py-2.5 text-xs font-medium transition-colors border-b last:border-0 border-border/40 flex items-center justify-between group ${
                          selectedBrands.includes(brand)
                            ? "bg-primary/5 text-primary"
                            : "hover:bg-muted"
                        }`}
                      >
                        {brand}
                        {selectedBrands.includes(brand) && (
                          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        )}
                      </button>
                    ))}
                  </div>
                  <div className="h-2 bg-muted/10 w-full" /> {/* Pequeo espaciador final */}
                </div>
              </>
            )}
          </div>
          
          {activeFiltersCount > 0 && (
            <button
              onClick={clearAllBrands}
              className="group bg-accent hover:bg-accent/90 text-accent-foreground text-xs font-bold rounded-full h-9 px-4 flex items-center justify-center gap-2 flex-shrink-0 animate-in zoom-in shadow-md border border-white/20 transition-all hover:scale-105 active:scale-95"
            >
              <span>{activeFiltersCount} {activeFiltersCount === 1 ? 'filtro' : 'filtros'}</span>
              <X className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
            </button>
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
