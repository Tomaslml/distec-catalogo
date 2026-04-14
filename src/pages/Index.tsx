import { useState, useCallback, useEffect } from "react";
import { useProducts } from "@/hooks/useProducts";
import StoreHeader from "@/components/store/StoreHeader";
import Hero from "@/components/store/Hero";
import FilterBar from "@/components/store/FilterBar";
import ProductCard from "@/components/store/ProductCard";
import CartPanel from "@/components/store/CartPanel";
import FloatingWhatsApp from "@/components/store/FloatingWhatsApp";
import Footer from "@/components/store/Footer";
import type { Product } from "@/lib/seedData";

export default function Index() {
  const { products, loading, loadingMore, hasMore, loadMore, loadAll } = useProducts();
  const [filtered, setFiltered] = useState<Product[]>([]);
  const [promoOnly, setPromoOnly] = useState(false);
  const [maryBosquesOnly, setMaryBosquesOnly] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);

  const handleFilter = useCallback((result: Product[]) => {
    setFiltered(result);
    setIsFiltering(result.length !== products.length);
  }, [products.length]);

  // Cuando se activa cualquier filtro especial, cargar todos los productos
  useEffect(() => {
    if (promoOnly || maryBosquesOnly) {
      loadAll();
    }
  }, [promoOnly, maryBosquesOnly]);

  const handleShowOffers = () => {
    setMaryBosquesOnly(true);
    setPromoOnly(false);
    document.getElementById("productos")?.scrollIntoView({ behavior: "smooth" });
  };

  const displayProducts = filtered;
  const isInitialLoading = loading && products.length === 0;

  return (
    <div className="min-h-screen flex flex-col">

      {/* RUEDA DE CARGA */}
      {isInitialLoading && (
        <div className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center animate-in fade-in duration-300">
          <div className="flex flex-col items-center gap-4">
            <div className="loading-spinner" />
            <h1 className="font-heading text-4xl font-bold text-accent uppercase tracking-widest">
              Distec
            </h1>
            <p className="text-muted-foreground text-sm font-medium animate-pulse">
              Cargando productos...
            </p>
          </div>
        </div>
      )}

      <StoreHeader />
      <Hero onShowOffers={handleShowOffers} />
      <FilterBar
        products={products}
        onFilter={handleFilter}
        promoOnly={promoOnly}
        setPromoOnly={setPromoOnly}
        maryBosquesOnly={maryBosquesOnly}
        setMaryBosquesOnly={setMaryBosquesOnly}
        onNeedAllProducts={loadAll}
      />

      <main id="productos" className="container mx-auto px-4 py-6 flex-1">

        {/* Skeletons mientras carga */}
        {isInitialLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-card rounded-xl border border-border overflow-hidden animate-pulse">
                <div className="aspect-square bg-muted" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-muted rounded w-1/3" />
                  <div className="h-4 bg-muted rounded w-2/3" />
                  <div className="h-3 bg-muted rounded w-full" />
                  <div className="h-9 bg-muted rounded w-full mt-2" />
                </div>
              </div>
            ))}
          </div>

        ) : loadingMore ? (
          // Rueda de carga al seleccionar una marca
          <div className="flex flex-col items-center py-16 gap-6">
            <div className="loading-spinner" />
            <p className="text-muted-foreground text-sm font-medium animate-pulse">
              Cargando productos...
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full mt-2 opacity-40">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-card rounded-xl border border-border overflow-hidden animate-pulse">
                  <div className="aspect-square bg-muted" />
                  <div className="p-3 space-y-2">
                    <div className="h-3 bg-muted rounded w-1/3" />
                    <div className="h-4 bg-muted rounded w-2/3" />
                    <div className="h-9 bg-muted rounded w-full mt-2" />
                  </div>
                </div>
              ))}
            </div>
          </div>

        ) : displayProducts.length === 0 ? (
          <div className="text-center py-16">
            <span className="text-5xl mb-4 block">🔍</span>
            <p className="text-muted-foreground text-lg font-medium">No se encontraron productos</p>
            <p className="text-muted-foreground/60 text-sm mt-1">Intentá con otros filtros</p>
          </div>

        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {displayProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* Botón Ver más — solo si no hay filtros activos */}
            {!isFiltering && hasMore && (
              <div className="flex justify-center mt-10">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="px-8 py-3 rounded-full bg-primary text-primary-foreground font-bold text-sm shadow-lg hover:opacity-90 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-60"
                >
                  {loadingMore ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Cargando...
                    </>
                  ) : (
                    "Ver más productos"
                  )}
                </button>
              </div>
            )}

            {/* Skeletons de carga adicional */}
            {loadingMore && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-card rounded-xl border border-border overflow-hidden animate-pulse">
                    <div className="aspect-square bg-muted" />
                    <div className="p-3 space-y-2">
                      <div className="h-3 bg-muted rounded w-1/3" />
                      <div className="h-4 bg-muted rounded w-2/3" />
                      <div className="h-9 bg-muted rounded w-full mt-2" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
      <CartPanel />
      <FloatingWhatsApp />
    </div>
  );
}
