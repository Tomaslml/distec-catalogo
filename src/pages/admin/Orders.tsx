import { useOrders, type Order } from "@/hooks/useOrders";
import { useState } from "react";
import { toast } from "sonner";

export default function AdminOrders() {
  const { orders, loading, updateOrderStatus } = useOrders();
  const [statusFilter, setStatusFilter] = useState<string>("Todos");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = statusFilter === "Todos" ? orders : orders.filter((o) => o.status === statusFilter);

  const pendingCount = orders.filter((o) => o.status === "Pendiente").length;
  const totalRevenue = orders.reduce((s, o) => s + o.total, 0);

  const formatPrice = (n: number) => "$" + n.toLocaleString("es-AR");
  const formatDate = (d: any) => {
    try {
      const date = d?.toDate ? d.toDate() : new Date(d);
      return date.toLocaleDateString("es-AR", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      });
    } catch {
      return "—";
    }
  };

  const handleStatus = async (id: string, status: Order["status"]) => {
    await updateOrderStatus(id, status);
    toast.success(`Estado actualizado: ${status}`);
  };

  const statusColors: Record<string, string> = {
    Pendiente: "bg-yellow-100 text-yellow-800",
    Confirmado: "bg-green-100 text-green-800",
    Enviado: "bg-blue-100 text-blue-800",
  };

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-bold">Pedidos</h1>

      <div className="flex flex-wrap gap-4 text-sm bg-card p-3 rounded-lg border border-border">
        <span>📦 Total pedidos: <strong>{orders.length}</strong></span>
        <span>🟡 Pendientes: <strong>{pendingCount}</strong></span>
        <span>💰 Total ARS: <strong>{formatPrice(totalRevenue)}</strong></span>
      </div>

      <div className="flex gap-2">
        {["Todos", "Pendiente", "Confirmado", "Enviado"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              statusFilter === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">
          {orders.length === 0 ? "Todavía no recibiste pedidos" : "Sin resultados para este filtro"}
        </p>
      ) : (
        <div className="space-y-2">
          {filtered.map((order) => (
            <div key={order.id} className="bg-card border border-border rounded-lg overflow-hidden">
              <div
                className="flex flex-wrap items-center gap-3 p-3 cursor-pointer hover:bg-muted/50"
                onClick={() => setExpandedId(expandedId === order.id ? null : order.id!)}
              >
                <span className="text-xs text-muted-foreground w-36">{formatDate(order.createdAt)}</span>
                <span className="text-sm flex-1 min-w-0 truncate">
                  {order.items.map((i) => `${i.qty}x ${i.name}`).join(", ")}
                </span>
                <span className="font-bold text-sm">{formatPrice(order.total)}</span>
                <span className="text-xs text-muted-foreground">
                  {order.couponCode ? `🎟️ ${order.couponCode}` : "—"}
                </span>
                <select
                  value={order.status}
                  onChange={(e) => {
                    e.stopPropagation();
                    handleStatus(order.id!, e.target.value as Order["status"]);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[order.status]} border-0 cursor-pointer`}
                >
                  <option value="Pendiente">🟡 Pendiente</option>
                  <option value="Confirmado">🟢 Confirmado</option>
                  <option value="Enviado">🔵 Enviado</option>
                </select>
              </div>

              {expandedId === order.id && (
                <div className="border-t border-border p-4 bg-muted/30 space-y-3">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-muted-foreground">
                        <th className="pb-1">Producto</th>
                        <th className="pb-1">Cant.</th>
                        <th className="pb-1">Precio</th>
                        <th className="pb-1">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.map((item, i) => (
                        <tr key={i} className="border-t border-border/50">
                          <td className="py-1">
                            {item.name} <span className="text-muted-foreground">({item.brand})</span>
                          </td>
                          <td className="py-1">{item.qty}</td>
                          <td className="py-1">{formatPrice(item.unitPrice)}</td>
                          <td className="py-1">{formatPrice(item.lineTotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="text-sm space-y-1">
                    <p>Subtotal: {formatPrice(order.subtotal)}</p>
                    {order.couponCode && (
                      <p className="text-accent">
                        Cupón {order.couponCode} (−{order.couponPercent}%): −{formatPrice(order.discount)}
                      </p>
                    )}
                    <p className="font-bold text-base">TOTAL: {formatPrice(order.total)}</p>
                  </div>
                  <a
                    href={`https://wa.me/5492616838178?text=${encodeURIComponent(
                      `Hola! Te contacto por el pedido de ${formatPrice(order.total)} del ${formatDate(order.createdAt)}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-whatsapp text-primary-foreground text-sm font-medium hover:opacity-90"
                  >
                    Contactar por WhatsApp
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
