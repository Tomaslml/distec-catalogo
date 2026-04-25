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
  const [cleanupLog, setCleanupLog] = useState<string[]>([]);

  useEffect(() => {
    getStats(7).then(s => { setStats(s); setLoading(false); });
  }, []);

  const addLog = (msg: string) => {
    setCleanupLog(prev => [...prev, msg]);
    console.log("[CLEANUP]", msg);
  };

  const handleCleanup = async () => {
    if (!confirm("Esto borrará TODOS los productos duplicados de la base de datos, dejando solo uno de cada nombre. ¿Continuar?")) return;
    setCleaning(true);
    setCleanupLog([]);
    
    try {
      addLog("Consultando todos los productos...");
      
      // Traer TODOS los productos (sin límite)
      let allProducts: any[] = [];
      let from = 0;
      const batchSize = 1000;
      
      while (true) {
        const { data, error } = await supabase
          .from('products')
          .select('id, name, brand, sort_order')
          .order('sort_order', { ascending: true })
          .range(from, from + batchSize - 1);
        
        if (error) {
          addLog(`Error al consultar: ${error.message}`);
          throw error;
        }
        
        if (!data || data.length === 0) break;
        allProducts = [...allProducts, ...data];
        if (data.length < batchSize) break;
        from += batchSize;
      }

      addLog(`Total de productos en la base de datos: ${allProducts.length}`);

      // Identificar duplicados por nombre normalizado
      const normalize = (text: string) =>
        text.normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/\s+/g, " ")
            .trim()
            .toLowerCase();

      const seen = new Map<string, { id: string; name: string }>();
      const toDelete: string[] = [];

      for (const p of allProducts) {
        const key = normalize(p.name);
        
        // Borrar productos de test
        if (key.includes("test")) {
          toDelete.push(p.id);
          addLog(`  ✗ TEST: "${p.name}" → BORRAR`);
          continue;
        }

        if (seen.has(key)) {
          toDelete.push(p.id);
          addLog(`  ✗ DUPLICADO: "${p.name}" (ya existe como "${seen.get(key)!.name}") → BORRAR`);
        } else {
          seen.set(key, { id: p.id, name: p.name });
        }
      }

      addLog(`\nProductos únicos: ${seen.size}`);
      addLog(`Duplicados a borrar: ${toDelete.length}`);

      if (toDelete.length > 0) {
        // Borrar en batches de 50 para evitar errores de URL
        const deleteBatchSize = 50;
        let deleted = 0;
        
        for (let i = 0; i < toDelete.length; i += deleteBatchSize) {
          const batch = toDelete.slice(i, i + deleteBatchSize);
          addLog(`Borrando batch ${Math.floor(i/deleteBatchSize) + 1}... (${batch.length} productos)`);
          
          const { error: delError } = await supabase
            .from('products')
            .delete()
            .in('id', batch);

          if (delError) {
            addLog(`⚠ Error al borrar batch: ${delError.message}`);
            // Intentar uno por uno si el batch falla
            for (const id of batch) {
              const { error: singleErr } = await supabase
                .from('products')
                .delete()
                .eq('id', id);
              if (singleErr) {
                addLog(`  ✗ No se pudo borrar ${id}: ${singleErr.message}`);
              } else {
                deleted++;
              }
            }
          } else {
            deleted += batch.length;
          }
        }

        addLog(`\n✓ Limpieza completa: ${deleted} de ${toDelete.length} duplicados eliminados.`);
        toast.success(`¡Limpieza exitosa! Se borraron ${deleted} duplicados.`);
        
        // Limpiar caché del navegador
        localStorage.removeItem("distec_products_cache");
        localStorage.removeItem("distec_cache_v");
        
        setTimeout(() => window.location.reload(), 2000);
      } else {
        addLog("✓ No se encontraron duplicados. La base de datos está limpia.");
        toast.info("No se encontraron duplicados.");
      }
    } catch (err: any) {
      addLog(`ERROR FATAL: ${err.message}`);
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
          className="flex items-center gap-2 px-4 py-2 bg-destructive/10 text-destructive hover:bg-destructive/20 rounded-xl transition-all font-bold text-sm border border-destructive/20"
        >
          {cleaning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {cleaning ? "Limpiando..." : "Limpiar Duplicados BD"}
        </button>
      </div>

      {/* Log de limpieza */}
      {cleanupLog.length > 0 && (
        <Card className="p-4 bg-muted/50 border-dashed">
          <CardTitle className="text-sm mb-2">📋 Log de Limpieza</CardTitle>
          <pre className="text-xs font-mono max-h-64 overflow-y-auto whitespace-pre-wrap text-muted-foreground">
            {cleanupLog.join("\n")}
          </pre>
        </Card>
      )}

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

