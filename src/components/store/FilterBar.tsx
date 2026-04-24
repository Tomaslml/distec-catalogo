import { Search, Tag, X } from "lucide-react";
import { useState, useEffect } from "react";
import type { Product } from "@/lib/seedData";
import { isProductEligibleForMaryBosquesPromo } from "@/lib/promoUtils";
import { supabase } from "@/lib/supabase";

interface FilterBarProps {
  products: Product[];
  onFilter: (filtered: Product[]) => void;
  promoOnly: boolean;
  setPromoOnly: (val: boolean) => void;
  maryBosquesOnly: boolean;
  setMaryBosquesOnly: (val: boolean) => void;
  onNeedAllProducts?: () => void;
}

export default function FilterBar({
  products,
  onFilter,
  promoOnly,
  setPromoOnly,
  maryBosquesOnly,
  setMaryBosquesOnly,
  onNeedAllProducts,
}: FilterBarProps) {
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showBrands, setShowBrands] = useState(false);
  const [allBrands, setAllBrands] = useState<string[]>([]);
  const [loadingBrands, setLoadingBrands] = useState(false);

  // Debounce búsqueda + cargar todos si el usuario busca
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (search.trim() && onNeedAllProducts) {
      onNeedAllProducts(); // Asegura que todos los productos estén cargados al buscar
    }
  }, [search]);

  // Traer todas las marcas directamente de Supabase (solo la columna "brand")
  const fetchAllBrands = async () => {
    if (allBrands.length > 0) return; // Ya cargadas, no repetir
    setLoadingBrands(true);
    try {
      const { data, error } = await supabase.from("products").select("brand");
      if (!error && data) {
        const unique = [...new Set(data.map((p: any) => p.brand as string))].sort();
        setAllBrands(unique);
      }
    } catch {}
    finally { setLoadingBrands(false); }
  };

  // Marcas a mostrar en el dropdown
  const brands = allBrands.length > 0
    ? allBrands
    : [...new Set(products.map((p) => p.brand))].sort();

  // Filtrado principal
  useEffect(() => {
    let result = [...products];

    // 1. Búsqueda de texto
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }

    // 2. Promo Hero exclusiva (Mary Bosques doypacks)
    if (maryBosquesOnly) {
      result = result.filter((p) => isProductEligibleForMaryBosquesPromo(p));
    }
    // 3. Ofertas generales
    else if (promoOnly) {
      result = result.filter((p) => {
        const isMaryBosques = /bosque/i.test(p.brand);
        if (isMaryBosques) {
          return isProductEligibleForMaryBosquesPromo(p) || p.discountPrice !== null;
        }
        return p.discountPrice !== null;
      });
    }
    // 4. Filtro por marca
    else if (selectedBrands.length > 0) {
      result = result.filter((p) => selectedBrands.includes(p.brand));
    }

    onFilter(result);
  }, [selectedBrands, promoOnly, maryBosquesOnly, debouncedSearch, products, onFilter]);

  const toggleBrand = (brand: string) => {
    const isAdding = !selectedBrands.includes(brand);
    if (isAdding && onNeedAllProducts) {
      onNeedAllProducts(); // Asegura que todos los productos están cargados
    }
    setPromoOnly(false);
    setMaryBosquesOnly(false);
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    );
  };

  const handlePromoToggle = () => {
    const newValue = !promoOnly;
    setPromoOnly(newValue);
    if (newValue) {
      setSelectedBrands([]);
      setMaryBosquesOnly(false);
      if (onNeedAllProducts) onNeedAllProducts();
    }
  };

  const clearAllBrands = () => {
    setSelectedBrands([]);
    setPromoOnly(false);
    setMaryBosquesOnly(false);
  };

  const activeFiltersCount =
    selectedBrands.length +
    (promoOnly ? 1 : 0) +
    (maryBosquesOnly ? 1 : 0) +
    (debouncedSearch.trim() ? 1 : 0);

  return (
    <div className="sticky top-16 md:top-20 z-40 bg-background/95 backdrop-blur-sm border-b border-border py-4">
      <div className="container mx-auto px-4 space-y-4">
        <div className="flex flex-wrap items-center gap-3 pb-1">

          {/* BOTÓN OFERTAS */}
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
              onClick={() => {
                if (!showBrands) fetchAllBrands(); // Cargar marcas al abrir
                setShowBrands(!showBrands);
              }}
              className={`whitespace-nowrap px-6 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 shadow-sm border-2 ${
                selectedBrands.length > 0
                  ? "bg-primary text-primary-foreground border-primary ring-2 ring-primary/20"
                  : "bg-white text-foreground border-border hover:bg-muted"
              }`}
            >
              <span>Filtrar por marca</span>
            </button>

            {/* DROPDOWN */}
            {showBrands && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowBrands(false)} />
                <div className="absolute left-0 mt-2 w-52 bg-card border border-border rounded-2xl shadow-xl z-20 overflow-hidden animate-in fade-in zoom-in duration-200">
                  <div className="p-2 border-b border-border bg-muted/30 flex items-center justify-between">
                    <span className="text-[10px] font-bold px-1 text-muted-foreground uppercase tracking-wider">
                      Marcas
                    </span>
                    <button
                      onClick={clearAllBrands}
                      className="text-[9px] font-black text-accent hover:bg-accent/10 py-1 px-2 rounded-lg border border-accent/20 transition-colors"
                    >
                      LIMPIAR
                    </button>
                  </div>
                  <div className="max-h-64 overflow-y-auto p-1 brand-scrollbar">
                    {loadingBrands ? (
                      <div className="py-4 text-center text-xs text-muted-foreground animate-pulse">Cargando marcas...</div>
                    ) : (
                      brands.map((brand) => (
                        <button
                          key={brand}
                          onClick={() => toggleBrand(brand)}
                          className={`w-full text-left px-3 py-2.5 text-xs font-medium transition-colors border-b last:border-0 border-border/40 flex items-center justify-between ${
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
                      ))
                    )}
                  </div>
                  <div className="h-2 bg-muted/10 w-full" />
                </div>
              </>
            )}
          </div>

          {/* CONTADOR DE FILTROS ACTIVOS */}
          {activeFiltersCount > 0 && (
            <button
              onClick={clearAllBrands}
              className="group bg-accent hover:bg-accent/90 text-accent-foreground text-xs font-bold rounded-full h-9 px-4 flex items-center justify-center gap-2 flex-shrink-0 animate-in zoom-in shadow-md border border-white/20 transition-all hover:scale-105 active:scale-95"
            >
              <span>{activeFiltersCount} {activeFiltersCount === 1 ? "filtro" : "filtros"}</span>
              <X className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
            </button>
          )}
        </div>

        {/* BARRA DE BÚSQUEDA */}
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
