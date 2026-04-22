import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import type { Product } from "@/lib/seedData";

const PAGE_SIZE = 48; // Aumentamos para traer "varios productos" de entrada
const BACKGROUND_BATCH_SIZE = 50;
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

  // Carga en batches secuenciales (para no saturar con una sola peticin gigante)
  const backgroundLoadAll = useCallback(async (startFrom: number) => {
    if (allLoadedRef.current) return;
    
    let currentFrom = startFrom;
    let finished = false;

    while (!finished) {
      try {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .order("sort_order", { ascending: true })
          .range(currentFrom, currentFrom + BACKGROUND_BATCH_SIZE - 1);

        if (error) throw error;
        
        if (data && data.length > 0) {
          const formatted = formatSupabaseProducts(data);
          setProducts(prev => {
            // Evitar duplicados por si acaso
            const existingIds = new Set(prev.map(p => p.id));
            const newOnes = formatted.filter(f => !existingIds.has(f.id));
            const combined = [...prev, ...newOnes].sort((a, b) => a.sortOrder - b.sortOrder);
            if (currentFrom === startFrom) saveCache(combined); // Guardar el primer set grande en cache
            return combined;
          });
          
          if (data.length < BACKGROUND_BATCH_SIZE) {
            finished = true;
            allLoadedRef.current = true;
            setHasMore(false);
          } else {
            currentFrom += BACKGROUND_BATCH_SIZE;
          }
        } else {
          finished = true;
          allLoadedRef.current = true;
          setHasMore(false);
        }
      } catch (err) {
        console.error("Batch load error:", err);
        finished = true; // Paramos si hay error crtico
      }
      
      // Pequea pausa entre batches para no bloquear el hilo principal
      await new Promise(r => setTimeout(r, 100));
    }
  }, []);

  // Carga inicial: muestra cache instantáneamente y luego refresca
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

      // 2. Cargar primera página GRANDE de Supabase
      try {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .order("sort_order", { ascending: true })
          .range(0, PAGE_SIZE - 1);

        if (error) throw error;

        if (data) {
          const formatted = formatSupabaseProducts(data);
          
          setProducts(prev => {
            if (hasCachedData) {
               // Combinamos el primer lote fresco con el resto del cach
               const otherProducts = prev.filter(p => !formatted.some(f => f.id === p.id));
               return [...formatted, ...otherProducts].sort((a, b) => a.sortOrder - b.sortOrder);
            }
            return formatted;
          });
          
          if (!hasCachedData) saveCache(formatted);
          pageRef.current = 0;
          setHasMore(data.length === PAGE_SIZE);
          
          // 3. Lanzar carga del resto en BATCHES secuenciales (si haba ms de PAGE_SIZE)
          if (data.length === PAGE_SIZE) {
            backgroundLoadAll(PAGE_SIZE);
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
  }, [backgroundLoadAll]);

  const loadMore = useCallback(async () => {
    // Si ya estamos cargando en segundo plano, no hacemos nada extra
    if (loadingMore || !hasMore || allLoadedRef.current) return;
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

  const loadAll = useCallback(async () => {
    if (allLoadedRef.current || loadingMore) return;
    // Si el usuario fuerza cargar todo (por filtro), simplemente dejamos que el background haga su trabajo 
    // o aceleramos si es necesario. Por ahora, el backgroundLoadAll secuencial es lo mejor.
  }, [loadingMore]);

  const addProduct = async (data: Omit<Product, "id" | "createdAt" | "sortOrder">) => {
    const { data: lastProduct } = await supabase
      .from("products")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1);
    
    const nextSortOrder = lastProduct && lastProduct.length > 0 
      ? (lastProduct[0].sort_order + 1) 
      : 0;

    const { data: result, error } = await supabase
      .from("products")
      .insert([{ ...data, sort_order: nextSortOrder }])
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
    if (data.imageUrl !== undefined) { dbData.image_url = data.imageUrl; delete dbData.image_url; }
    if (data.sortOrder !== undefined) { dbData.sort_order = data.sortOrder; delete dbData.sortOrder; }

    const { error } = await supabase.from("products").update(dbData).eq("id", id);
    if (error) throw error;
    
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
  };

  const updateProductOrder = async (orderedIds: { id: string; sort_order: number }[]) => {
    const { error } = await supabase
      .from("products")
      .upsert(orderedIds);
    
    if (error) throw error;
    
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
