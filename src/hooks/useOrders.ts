import { useState, useEffect } from "react";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  Timestamp,
  query,
  orderBy,
  onSnapshot,
  getDocs,
} from "firebase/firestore";

export interface OrderItem {
  productId: string;
  name: string;
  brand: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
}

export interface Order {
  id?: string;
  items: OrderItem[];
  subtotal: number;
  couponCode: string | null;
  couponPercent: number | null;
  discount: number;
  total: number;
  status: "Pendiente" | "Confirmado" | "Enviado";
  createdAt: Date | any;
}

const COLLECTION = "orders";

function getLocalOrders(): Order[] {
  const stored = localStorage.getItem("distec_orders");
  return stored ? JSON.parse(stored) : [];
}

function saveLocalOrders(orders: Order[]) {
  localStorage.setItem("distec_orders", JSON.stringify(orders));
}

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isFirebaseConfigured) {
      const q = query(collection(db, COLLECTION), orderBy("createdAt", "desc"));
      const unsub = onSnapshot(q, (snap) => {
        setOrders(
          snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order))
        );
        setLoading(false);
      }, () => {
        setOrders(getLocalOrders());
        setLoading(false);
      });
      return unsub;
    } else {
      setOrders(getLocalOrders());
      setLoading(false);
    }
  }, []);

  const addOrder = async (order: Omit<Order, "id" | "createdAt">) => {
    if (isFirebaseConfigured) {
      await addDoc(collection(db, COLLECTION), {
        ...order,
        createdAt: Timestamp.now(),
      });
    } else {
      const all = getLocalOrders();
      all.unshift({ ...order, id: `order_${Date.now()}`, createdAt: new Date().toISOString() });
      saveLocalOrders(all);
      setOrders(all);
    }
  };

  const updateOrderStatus = async (id: string, status: Order["status"]) => {
    if (isFirebaseConfigured) {
      await updateDoc(doc(db, COLLECTION, id), { status });
    } else {
      const all = getLocalOrders().map((o) =>
        o.id === id ? { ...o, status } : o
      );
      saveLocalOrders(all);
      setOrders(all);
    }
  };

  return { orders, loading, addOrder, updateOrderStatus };
}
