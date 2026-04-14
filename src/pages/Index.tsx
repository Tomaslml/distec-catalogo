import { useState, useCallback } from "react";
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
  const { products, loading } = useProducts();
  const [filtered, setFiltered] = useState<Product[]>([]);
  const [promoOnly, setPromoOnly] = useState(false);
  const [maryBosquesOnly, setMaryBosquesOnly] = useState(false);

  const handleFilter = useCallback((result: Product[]) => {
    setFiltered(result);
  }, []);

  const handleShowOffers = () => {
    setMaryBosquesOnly(true);
    setPromoOnly(false);
    document.getElementById("productos")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <StoreHeader />
      <Hero onShowOffers={handleShowOffers} />
      <FilterBar 
        products={products} 
        onFilter={handleFilter} 
        promoOnly={promoOnly}
        setPromoOnly={setPromoOnly}
        maryBosquesOnly={maryBosquesOnly}
        setMaryBosquesOnly={setMaryBosquesOnly}
      />

      <main className="container mx-auto px-4 py-6 flex-1">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-card rounded-lg border border-border overflow-hidden animate-pulse">
                <div className="aspect-square bg-muted" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-muted rounded w-1/3" />
                  <div className="h-4 bg-muted rounded w-2/3" />
                  <div className="h-3 bg-muted rounded w-full" />
                  <div className="h-5 bg-muted rounded w-1/2" />
                  <div className="h-9 bg-muted rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-4xl mb-4 block">🔍</span>
            <p className="text-muted-foreground text-lg">No se encontraron productos</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>

      <Footer />
      <CartPanel />
      <FloatingWhatsApp />
    </div>
  );
}
