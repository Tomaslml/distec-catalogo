import { useEffect, useState } from "react";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useOrders } from "@/hooks/useOrders";
import { useProducts } from "@/hooks/useProducts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Eye, DollarSign, TrendingUp, Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export default function AdminDashboard() {
  const { getStats } = useAnalytics();
  const { orders } = useOrders();
  const { products } = useProducts();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cleaning, setCleaning] = useState(false);

  useEffect(() => {
    getStats(7).then(s => { setStats(s); setLoading(false); });
  }, []);

  const handleCleanup = async () => {
    if (!confirm("Esto borrará todos los productos duplicados (con el mismo nombre). ¿Continuar?")) return;
    setCleaning(true);
    try {
      const { data: allProducts, error } = await supabase
        .from('products')
        .select('id, name, brand')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const seen = new Set();
      const toDelete: string[] = [];

      allProducts?.forEach(p => {
        const key = `${p.name}-${p.brand}`.toLowerCase().trim();
        if (seen.has(key)) {
          toDelete.push(p.id);
        } else {
          seen.add(key);
        }
      });

      if (toDelete.length > 0) {
        const { error: delError } = await supabase
          .from('products')
          .delete()
          .in('id', toDelete);

        if (delError) throw delError;
        toast.success(`¡Limpieza exitosa! Se borraron ${toDelete.length} duplicados.`);
        window.location.reload();
      } else {
        toast.info("No se encontraron productos duplicados.");
      }
    } catch (err: any) {
      toast.error("Error al limpiar: " + err.message);
    } finally {
      setCleaning(false);
    }
  };

  const totalRevenue = orders ? orders.reduce((acc: number, o: any) => acc + o.total, 0) : 0;
  const avgOrder = orders && orders.length > 0 ? totalRevenue / orders.length : 0;
  const fmt = (v: number) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(v);

  if (loading || !stats) return (<div className="p-8 text-muted-foreground">Cargando estadísticas...</div>);

  return (
    <div className="space-y-6 pb-10">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Panel de Control</h1>
          <p className="text-muted-foreground">Estadísticas de tráfico y ventas.</p>
        </div>
        <button
          onClick={handleCleanup}
          disabled={cleaning}
          className="flex items-center gap-2 px-4 py-2 bg-accent/10 text-accent hover:bg-accent/20 rounded-xl transition-all font-bold text-sm border border-accent/20"
        >
          {cleaning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Limpiar Duplicados
        </button>
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

