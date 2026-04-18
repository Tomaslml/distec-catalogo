import { useEffect, useState } from "react";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useOrders } from "@/hooks/useOrders";
import { useProducts } from "@/hooks/useProducts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Eye, DollarSign, TrendingUp, ShoppingBag } from "lucide-react";

export default function AdminDashboard() {
    const { getStats } = useAnalytics();
    const { orders } = useOrders();
    const { products } = useProducts();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

  useEffect(() => { getStats(7).then(s => { setStats(s); setLoading(false); }); }, []);

  const totalRevenue = orders ? orders.reduce((acc: number, o: any) => acc + o.total, 0) : 0;
    const avgOrder = orders && orders.length > 0 ? totalRevenue / orders.length : 0;
    const fmt = (v: number) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(v);

  if (loading || !stats) {
        return <div className="p-8 text-muted-foreground">Cargando estadisticas...</div>div>;
  }
  
    return (
          <div className="space-y-6 pb-10">
                <div>
                        <h1 className="text-3xl font-bold tracking-tight">Panel de Control</h1>h1>
                        <p className="text-muted-foreground">Estadisticas de trafico y ventas.</p>p>
                </div>div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className="border-l-4 border-l-primary">
                                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                                              <CardTitle className="text-sm font-medium">Vistas Totales</CardTitle>CardTitle>
                                              <Eye className="h-4 w-4 text-muted-foreground" />
                                  </CardHeader>CardHeader>
                                  <CardContent>
                                              <div className="text-2xl font-bold">{stats.totalVisits}</div>div>
                                  </CardContent>CardContent>
                        </Card>Card>
                </div>div>
          </div>div>
        );
}
</div>
