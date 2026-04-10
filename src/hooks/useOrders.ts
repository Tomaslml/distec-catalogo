import { useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

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

const TABLE = "orders";

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
    if (isSupabaseConfigured) {
      fetchOrders();

      // Listen for changes in real-time
      const channel = supabase
        .channel('schema-db-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: TABLE },
          () => fetchOrders()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      setOrders(getLocalOrders());
      setLoading(false);
    }
  }, []);

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch orders error:", error);
    } else if (data) {
      setOrders(data.map(d => ({
        ...d,
        createdAt: new Date(d.created_at)
      } as Order)));
    }
    setLoading(false);
  };

  const addOrder = async (order: Omit<Order, "id" | "createdAt">) => {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from(TABLE).insert([{
        items: order.items,
        subtotal: order.subtotal,
        coupon_code: order.couponCode,
        coupon_percent: order.couponPercent,
        discount: order.discount,
        total: order.total,
        status: order.status
      }]);
      if (error) throw error;
    } else {
      const all = getLocalOrders();
      all.unshift({ ...order, id: `order_${Date.now()}`, createdAt: new Date().toISOString() });
      saveLocalOrders(all);
      setOrders(all);
    }
  };

  const updateOrderStatus = async (id: string, status: Order["status"]) => {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from(TABLE).update({ status }).eq("id", id);
      if (error) throw error;
      await fetchOrders();
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
