import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import type { Product } from "@/lib/seedData";

const PAGE_SIZE = 12;
const CACHE_KEY = "distec_products_cache";

function formatSupabaseProducts(data: any[]): Product[] {
  return data.map((p) => ({
    ...p,
    isNew: p.is_new,
    discountPrice: p.discount_price,
    imageUrl: p.image_url,
    sortOrder: p.sort_order,
    emoji: p.emoji || "🧴",
  }));
}

function saveCache(products: Product[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(products.slice(0, 48)));
  } catch {
    try { localStorage.removeItem(CACHE_KEY); } catch {}
  }
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const pageRef = useRef(0);

  // Carga inicial: muestra cache instantáneamente y luego refresca
  useEffect(() => {
    const init = async () => {
      // 1. Mostrar caché inmediatamente
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setProducts(parsed);
            setLoading(false);
          }
        }
      } catch {}

      // 2. Cargar primera página de Supabase
      try {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .order("sort_order", { ascending: true })
          .range(0, PAGE_SIZE - 1);

        if (error) throw error;

        if (data) {
          const formatted = formatSupabaseProducts(data);
          setProducts(formatted);
          saveCache(formatted);
          pageRef.current = 0;
          setHasMore(data.length === PAGE_SIZE);
        }
      } catch (err) {
        console.error("Error cargando productos:", err);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  // Cargar más productos (para el botón "Ver más")
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);

    try {
      const nextPage = pageRef.current + 1;
      const from = nextPage * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("sort_order", { ascending: true })
        .range(from, to);

      if (error) throw error;

      if (data) {
        const formatted = formatSupabaseProducts(data);
        setProducts(prev => {
          const combined = [...prev, ...formatted];
          saveCache(combined);
          return combined;
        });
        pageRef.current = nextPage;
        setHasMore(data.length === PAGE_SIZE);
      }
    } catch (err) {
      console.error("Error cargando más productos:", err);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore]);

  const updateProductOrder = async (orderedIds: { id: string; sort_order: number }[]) => {
    const updates = orderedIds.map(item =>
      supabase.from("products").update({ sort_order: item.sort_order }).eq("id", item.id)
    );
    const results = await Promise.all(updates);
    const firstError = results.find(r => r.error)?.error;
    if (firstError) throw firstError;
  };

  const deleteProduct = async (id: string) => {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) throw error;
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  return { products, loading, loadingMore, hasMore, loadMore, updateProductOrder, deleteProduct };
}
