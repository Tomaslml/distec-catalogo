import { useEffect, useState } from "react";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useOrders } from "@/hooks/useOrders";
import { useProducts } from "@/hooks/useProducts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Eye, DollarSign, TrendingUp } from "lucide-react";

export default function AdminDashboard() {
  const { getStats } = useAnalytics();
  const { orders } = useOrders();
  const { products } = useProducts();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStats(7).then(s => { setStats(s); setLoading(false); });
  }, []);

  const totalRevenue = orders ? orders.reduce((acc: number, o: any) => acc + o.total, 0) : 0;
  const avgOrder = orders && orders.length > 0 ? totalRevenue / orders.length : 0;
  const fmt = (v: number) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(v);

  if (loading || !stats) return (<div className="p-8 text-muted-foreground">Cargando estadísticas...</div>);

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Panel de Control</h1>
        <p className="text-muted-foreground">Estadísticas de tráfico y ventas.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Vistas Totales</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.totalVisits}</div></CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Visitantes Únicos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.uniqueVisitors}</div></CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{fmt(totalRevenue)}</div></CardContent>
        </Card>
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ticket Promedio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{fmt(avgOrder)}</div></CardContent>
        </Card>
      </div>
      <Card className="p-6">
        <CardTitle className="mb-4">Resumen de Tienda</CardTitle>
        <CardContent className="space-y-3 p-0">
          <div className="flex justify-between"><span>Productos Activos</span><strong>{products ? products.length : 0}</strong></div>
          <div className="flex justify-between"><span>Pedidos Totales</span><strong>{orders ? orders.length : 0}</strong></div>
          <div className="flex justify-between"><span>Pedidos Pendientes</span><strong>{orders ? orders.filter((o: any) => o.status === "Pendiente").length : 0}</strong></div>
        </CardContent>
      </Card>
    </div>
  );
}

