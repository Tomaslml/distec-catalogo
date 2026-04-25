import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import type { Product } from "@/lib/seedData";

const PAGE_SIZE = 12; 
const BATCH_SIZE = 50;
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
    localStorage.setItem(CACHE_KEY, JSON.stringify(products.slice(0, 100)));
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
  const allLoadedRef = useRef(false);

  // Carga TODO en batches PARALELOS (mucho más rápido que secuencial)
  const fetchAllInBatches = useCallback(async (totalCount: number) => {
    if (allLoadedRef.current) return;

    // Calculamos los rangos de todos los batches que faltan (empezando desde el primer batch cargado)
    const ranges: { from: number; to: number }[] = [];
    for (let from = PAGE_SIZE; from < totalCount; from += BATCH_SIZE) {
      ranges.push({ from, to: Math.min(from + BATCH_SIZE - 1, totalCount - 1) });
    }

    if (ranges.length === 0) {
      allLoadedRef.current = true;
      setHasMore(false);
      return;
    }

    try {
      // Disparamos TODAS las peticiones en paralelo (Batch Fetching real)
      const promises = ranges.map(range => 
        supabase
          .from("products")
          .select("*")
          .order("sort_order", { ascending: true })
          .range(range.from, range.to)
      );

      const results = await Promise.all(promises);
      
      const allNewProducts: Product[] = [];
      results.forEach(res => {
        if (res.data) {
          allNewProducts.push(...formatSupabaseProducts(res.data));
        }
      });

      setProducts(prev => {
        // De-duplicate using Map to ensure unique IDs
        const combined = [...prev, ...allNewProducts];
        const uniqueMap = new Map();
        combined.forEach(p => uniqueMap.set(p.id, p));
        const unique = Array.from(uniqueMap.values()).sort((a, b) => a.sortOrder - b.sortOrder);
        
        saveCache(unique);
        return unique;
      });

      allLoadedRef.current = true;
      setHasMore(false);
    } catch (err) {
      console.error("Parallel batch fetch error:", err);
    }
  }, []);

  // Carga inicial
  useEffect(() => {
    const init = async () => {
      let hasCachedData = false;
      
      // 1. Mostrar caché inmediatamente
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setProducts(parsed);
            setLoading(false);
            hasCachedData = true;
          }
        }
      } catch {}

      // 2. Obtener primer batch Y el conteo total simultáneamente
      try {
        const [firstPageRes, countRes] = await Promise.all([
          supabase
            .from("products")
            .select("*")
            .order("sort_order", { ascending: true })
            .range(0, PAGE_SIZE - 1),
          supabase
            .from("products")
            .select("id", { count: 'exact', head: true })
        ]);

        if (firstPageRes.error) throw firstPageRes.error;

        if (firstPageRes.data) {
          const formatted = formatSupabaseProducts(firstPageRes.data);
          
          setProducts(prev => {
            const current = hasCachedData ? prev : [];
            const combined = [...formatted, ...current];
            const uniqueMap = new Map();
            combined.forEach(p => uniqueMap.set(p.id, p));
            return Array.from(uniqueMap.values()).sort((a, b) => a.sortOrder - b.sortOrder);
          });
          
          if (!hasCachedData) saveCache(formatted);
          pageRef.current = 0;
          
          // 3. Si hay más productos, cargarlos todos en batches paralelos
          const totalCount = countRes.count || 0;
          if (totalCount > PAGE_SIZE) {
            fetchAllInBatches(totalCount);
          } else {
            allLoadedRef.current = true;
            setHasMore(false);
          }
        }
      } catch (err) {
        console.error("Error cargando productos:", err);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [fetchAllInBatches]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || allLoadedRef.current) return;
    // La carga paralela ya se encarga de todo, este botón solo es fallback o para casos manuales
  }, [loadingMore, hasMore]);

  const loadAll = useCallback(async () => {
    // Ya implementado vía fetchAllInBatches en init
  }, []);

  const addProduct = async (data: Omit<Product, "id" | "createdAt" | "sortOrder">) => {
    const { data: lastProduct } = await supabase
      .from("products")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1);
    
    const nextSortOrder = lastProduct && lastProduct.length > 0 
      ? (lastProduct[0].sort_order + 1) 
      : 0;

    // Convert camelCase to snake_case for Supabase
    const dbData: any = {
      name: data.name,
      brand: data.brand,
      price: data.price,
      discount_price: data.discountPrice,
      description: data.description,
      image_url: data.imageUrl,
      emoji: data.emoji,
      is_new: data.isNew,
      sort_order: nextSortOrder,
    };

    const { data: result, error } = await supabase
      .from("products")
      .insert([dbData])
      .select();

    if (error) throw error;
    if (result) {
      const formatted = formatSupabaseProducts(result)[0];
      setProducts(prev => [...prev, formatted]);
    }
  };

  const updateProduct = async (id: string, data: Partial<Product>) => {
    const dbData: any = { ...data };
    if (data.isNew !== undefined) { dbData.is_new = data.isNew; delete dbData.isNew; }
    if (data.discountPrice !== undefined) { dbData.discount_price = data.discountPrice; delete dbData.discountPrice; }
    if (data.imageUrl !== undefined) { dbData.image_url = data.imageUrl; delete dbData.imageUrl; }
    if (dbData.image_url === undefined) delete dbData.image_url;
    if (data.sortOrder !== undefined) { dbData.sort_order = data.sortOrder; delete dbData.sortOrder; }

    const { error } = await supabase.from("products").update(dbData).eq("id", id);
    if (error) throw error;
    
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
  };

  const updateProductOrder = async (orderedIds: { id: string; sort_order: number }[]) => {
    // Actualizamos cada producto individualmente en paralelo (upsert falla con campos required)
    const results = await Promise.all(
      orderedIds.map(({ id, sort_order }) =>
        supabase
          .from("products")
          .update({ sort_order })
          .eq("id", id)
      )
    );

    const firstError = results.find(r => r.error);
    if (firstError?.error) throw firstError.error;
    
    setProducts(prev => {
      const newProducts = [...prev];
      orderedIds.forEach(update => {
        const index = newProducts.findIndex(p => p.id === update.id);
        if (index !== -1) {
          newProducts[index] = { ...newProducts[index], sortOrder: update.sort_order };
        }
      });
      return newProducts.sort((a, b) => a.sortOrder - b.sortOrder);
    });
  };

  const deleteProduct = async (id: string) => {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) throw error;
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  return { 
    products, 
    loading, 
    loadingMore, 
    hasMore, 
    loadMore, 
    loadAll, 
    addProduct,
    updateProduct,
    updateProductOrder, 
    deleteProduct 
  };
}
