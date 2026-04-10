import { useProducts } from "@/hooks/useProducts";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Pencil, Trash2, Search, Plus } from "lucide-react";
import { toast } from "sonner";

export default function AdminProducts() {
  const { products, loading, deleteProduct } = useProducts();
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.brand.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar "${name}"?`)) return;
    setDeleting(id);
    await deleteProduct(id);
    toast.success("Producto eliminado");
    setDeleting(null);
  };

  const formatPrice = (n: number) => "$" + n.toLocaleString("es-AR");

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-bold">
          Productos
          {isSupabaseConfigured ? (
            <span className="ml-3 text-xs bg-green-500/10 text-green-600 px-2 py-1 rounded-full border border-green-500/20 align-middle inline-block">Supabase Activo</span>
          ) : (
            <span className="ml-3 text-xs bg-yellow-500/10 text-yellow-600 px-2 py-1 rounded-full border border-yellow-500/20 align-middle inline-block">Modo Local (Sin BD)</span>
          )}
        </h1>
        <Link
          to="/admin/products/new"
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90"
        >
          <Plus className="w-4 h-4" /> Agregar producto
        </Link>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar productos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-lg bg-muted border-0 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">
          {products.length === 0 ? "No hay productos cargados aún" : "Sin resultados"}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="py-2 px-2">Imagen</th>
                <th className="py-2 px-2">Nombre</th>
                <th className="py-2 px-2 hidden sm:table-cell">Marca</th>
                <th className="py-2 px-2">Precio</th>
                <th className="py-2 px-2 hidden md:table-cell">Descuento</th>
                <th className="py-2 px-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const hasDiscount = p.discountPrice !== null && p.discountPrice < p.price;
                const pct = hasDiscount ? Math.round((1 - p.discountPrice! / p.price) * 100) : 0;
                return (
                  <tr key={p.id} className="border-b border-border hover:bg-muted/50">
                    <td className="py-2 px-2">
                      <div className="w-12 h-12 rounded bg-muted flex items-center justify-center overflow-hidden">
                        {p.imageUrl ? (
                          <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xl">{p.emoji}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-2 px-2">
                      <div>
                        <p className="font-medium">{p.name}</p>
                        {p.isNew && (
                          <span className="text-xs bg-nuevo text-accent-foreground px-1.5 py-0.5 rounded">NUEVO</span>
                        )}
                      </div>
                    </td>
                    <td className="py-2 px-2 hidden sm:table-cell text-muted-foreground">{p.brand}</td>
                    <td className="py-2 px-2">{formatPrice(p.price)}</td>
                    <td className="py-2 px-2 hidden md:table-cell">
                      {hasDiscount ? (
                        <span>
                          {formatPrice(p.discountPrice!)} <span className="text-xs bg-discount text-primary-foreground px-1 rounded">−{pct}%</span>
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-2 px-2">
                      <div className="flex gap-1">
                        <Link
                          to={`/admin/products/edit/${p.id}`}
                          className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
                        >
                          <Pencil className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(p.id!, p.name)}
                          disabled={deleting === p.id}
                          className="p-1.5 hover:bg-destructive/10 rounded text-muted-foreground hover:text-destructive disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
