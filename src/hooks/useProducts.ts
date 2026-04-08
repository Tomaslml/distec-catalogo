import { useState, useEffect } from "react";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
} from "firebase/firestore";
import { seedProducts, type Product } from "@/lib/seedData";

const COLLECTION = "products";

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
    if (isFirebaseConfigured) {
      try {
        const snap = await getDocs(collection(db, COLLECTION));
        if (snap.empty) {
          // Seed Firestore
          for (const p of seedProducts) {
            await addDoc(collection(db, COLLECTION), {
              ...p,
              createdAt: Timestamp.now(),
            });
          }
          const snap2 = await getDocs(collection(db, COLLECTION));
          setProducts(
            snap2.docs.map((d) => ({ id: d.id, ...d.data() } as Product))
          );
        } else {
          setProducts(
            snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product))
          );
        }
      } catch {
        setProducts(getLocalProducts());
      }
    } else {
      setProducts(getLocalProducts());
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const addProduct = async (product: Omit<Product, "id" | "createdAt">) => {
    if (isFirebaseConfigured) {
      await addDoc(collection(db, COLLECTION), {
        ...product,
        createdAt: Timestamp.now(),
      });
    } else {
      const all = getLocalProducts();
      const newP = { ...product, id: `local_${Date.now()}`, createdAt: new Date() };
      all.push(newP);
      saveLocalProducts(all);
    }
    await fetchProducts();
  };

  const updateProduct = async (id: string, data: Partial<Product>) => {
    if (isFirebaseConfigured) {
      await updateDoc(doc(db, COLLECTION, id), data);
    } else {
      const all = getLocalProducts().map((p) =>
        p.id === id ? { ...p, ...data } : p
      );
      saveLocalProducts(all);
    }
    await fetchProducts();
  };

  const deleteProduct = async (id: string) => {
    if (isFirebaseConfigured) {
      await deleteDoc(doc(db, COLLECTION, id));
    } else {
      const all = getLocalProducts().filter((p) => p.id !== id);
      saveLocalProducts(all);
    }
    await fetchProducts();
  };

  return { products, loading, addProduct, updateProduct, deleteProduct, refetch: fetchProducts };
}
