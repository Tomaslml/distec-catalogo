import { useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { seedProducts, type Product } from "@/lib/seedData";

const TABLE = "products";

function getLocalProducts(): Product[] {
  const stored = localStorage.getItem("distec_products");
  if (stored) return JSON.parse(stored);
  const seeded = seedProducts.map((p, i) => ({
    ...p,
    id: `local_${i}`,
    createdAt: new Date(),
  }));
  localStorage.setItem("distec_products", JSON.stringify(seeded));
  return seeded;
}

function saveLocalProducts(products: Product[]) {
  localStorage.setItem("distec_products", JSON.stringify(products));
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    setLoading(true);
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from(TABLE)
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;

        if (!data || data.length === 0) {
          // Seed Supabase if empty
          const toInsert = seedProducts.map(p => ({
            name: p.name,
            brand: p.brand,
            price: p.price,
            discount_price: p.discountPrice,
            description: p.description,
            image_url: p.imageUrl,
            emoji: p.emoji,
            is_new: p.isNew
          }));
          await supabase.from(TABLE).insert(toInsert);
          const { data: data2 } = await supabase.from(TABLE).select("*").order("created_at", { ascending: false });
          setProducts(formatSupabaseProducts(data2 || []));
        } else {
          setProducts(formatSupabaseProducts(data));
        }
      } catch (err) {
        console.error("Supabase fetch error:", err);
        setProducts(getLocalProducts());
      }
    } else {
      setProducts(getLocalProducts());
    }
    setLoading(false);
  };

  function formatSupabaseProducts(data: any[]): Product[] {
    return data.map(d => ({
      id: d.id,
      name: d.name,
      brand: d.brand,
      price: d.price,
      discountPrice: d.discount_price,
      description: d.description,
      imageUrl: d.image_url,
      emoji: d.emoji,
      isNew: d.is_new,
      createdAt: new Date(d.created_at)
    }));
  }

  useEffect(() => {
    fetchProducts();
  }, []);

  const addProduct = async (product: Omit<Product, "id" | "createdAt">) => {
    if (isSupabaseConfigured) {
      await supabase.from(TABLE).insert([{
        name: product.name,
        brand: product.brand,
        price: product.price,
        discount_price: product.discountPrice,
        description: product.description,
        image_url: product.imageUrl,
        emoji: product.emoji,
        is_new: product.isNew
      }]);
    } else {
      const all = getLocalProducts();
      const newP = { ...product, id: `local_${Date.now()}`, createdAt: new Date() };
      all.push(newP);
      saveLocalProducts(all);
    }
    await fetchProducts();
  };

  const updateProduct = async (id: string, data: Partial<Product>) => {
    if (isSupabaseConfigured) {
      const updateData: any = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.brand !== undefined) updateData.brand = data.brand;
      if (data.price !== undefined) updateData.price = data.price;
      if (data.discountPrice !== undefined) updateData.discount_price = data.discountPrice;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.imageUrl !== undefined) updateData.image_url = data.imageUrl;
      if (data.emoji !== undefined) updateData.emoji = data.emoji;
      if (data.isNew !== undefined) updateData.is_new = data.isNew;

      await supabase.from(TABLE).update(updateData).eq("id", id);
    } else {
      const all = getLocalProducts().map((p) =>
        p.id === id ? { ...p, ...data } : p
      );
      saveLocalProducts(all);
    }
    await fetchProducts();
  };

  const deleteProduct = async (id: string) => {
    if (isSupabaseConfigured) {
      await supabase.from(TABLE).delete().eq("id", id);
    } else {
      const all = getLocalProducts().filter((p) => p.id !== id);
      saveLocalProducts(all);
    }
    await fetchProducts();
  };

  return { products, loading, addProduct, updateProduct, deleteProduct, refetch: fetchProducts };
}
