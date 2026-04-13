import { useProducts } from "@/hooks/useProducts";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Pencil, Trash2, Search, Plus, Save, GripVertical, X } from "lucide-react";
import { toast } from "sonner";
import type { Product } from "@/lib/seedData";

export default function AdminProducts() {
  const { products, loading, deleteProduct, updateProduct } = useProducts();
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [orderedProducts, setOrderedProducts] = useState<Product[]>([]);
  const [savingOrder, setSavingOrder] = useState(false);
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);

  useEffect(() => {
    if (products.length > 0 && !isReorderMode) {
      setOrderedProducts([...products]);
    }
  }, [products, isReorderMode]);

  const filtered = isReorderMode 
    ? orderedProducts 
    : orderedProducts.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.brand.toLowerCase().includes(search.toLowerCase())
      );

  const onDragStart = (e: React.DragEvent, index: number) => {
    setDraggedItemIndex(index);
    e.dataTransfer.effectAllowed = "move";
    // Set a transparent ghost image or just let the browser handle it
  };

  const onDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedItemIndex === null || draggedItemIndex === index) return;

    const newItems = [...orderedProducts];
    const draggedItem = newItems[draggedItemIndex];
    newItems.splice(draggedItemIndex, 1);
    newItems.splice(index, 0, draggedItem);
    
    setDraggedItemIndex(index);
    setOrderedProducts(newItems);
  };

  const onDragEnd = () => {
    setDraggedItemIndex(null);
  };

  const saveNewOrder = async () => {
    setSavingOrder(true);
    try {
      // Solo actualizamos el sortOrder
      const updates = orderedProducts.map((p, index) => 
        updateProduct(p.id!, { sortOrder: index })
      );
      await Promise.all(updates);
      toast.success("✓ Orden guardado correctamente");
      setIsReorderMode(false);
    } catch (err) {
      console.error("Error saving order:", err);
      toast.error("Error al guardar el orden. ¿Agregaste la columna 'sort_order' en Supabase?");
    } finally {
      setSavingOrder(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar "${name}"?`)) return;
    setDeleting(id);
    await deleteProduct(id);
    toast.success("Producto eliminado");
    setDeleting(null);
  };

  const formatPrice = (n: number) => "$" + n.toLocaleString("es-AR");

  return (
    <div className="space-y-6 pb-20 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold flex items-center gap-3">
            Gestión de Productos
            {isSupabaseConfigured ? (
              <span className="text-[10px] bg-green-500/10 text-green-600 px-2 py-1 rounded-full border border-green-500/20 uppercase tracking-tighter">Conectado</span>
            ) : (
              <span className="text-[10px] bg-yellow-500/10 text-yellow-600 px-2 py-1 rounded-full border border-yellow-500/20 uppercase tracking-tighter">Local</span>
            )}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isReorderMode 
              ? "Arrastrá los productos para cambiar el orden en la tienda." 
              : "Administrá el inventario, precios y ofertas de tu catálogo."}
          </p>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          {isReorderMode ? (
            <>
              <button
                onClick={() => {
                  setIsReorderMode(false);
                  setOrderedProducts([...products]);
                }}
                className="flex-1 md:flex-none px-4 py-2 rounded-xl bg-muted text-muted-foreground text-sm font-bold hover:bg-muted/80 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={saveNewOrder}
                disabled={savingOrder}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-accent text-accent-foreground px-6 py-2 rounded-xl text-sm font-black shadow-lg shadow-accent/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
              >
                <Save className={`w-4 h-4 ${savingOrder ? 'animate-spin' : ''}`} />
                {savingOrder ? "Guardando..." : "Guardar este orden"}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsReorderMode(true)}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-muted text-muted-foreground px-4 py-2 rounded-xl text-sm font-bold hover:bg-muted/80 transition-all border border-border"
              >
                <GripVertical className="w-4 h-4" />
                Cambiar Orden
              </button>
              <Link
                to="/admin/products/new"
                className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-2 rounded-xl text-sm font-black shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4" /> Agregar Producto
              </Link>
            </>
          )}
        </div>
      </div>

      {!isReorderMode && (
        <div className="relative group max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-accent transition-colors" />
          <input
            type="text"
            placeholder="Buscar por nombre o marca..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-2xl bg-muted border-2 border-transparent focus:border-accent/20 focus:bg-background shadow-sm transition-all focus:outline-none text-sm"
          />
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-muted rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-muted/30 rounded-3xl border-2 border-dashed border-border">
          <p className="text-muted-foreground">No se encontraron productos.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((p, index) => {
            const hasDiscount = p.discountPrice !== null && p.discountPrice < p.price;
            const isDragging = draggedItemIndex === index;

            return (
              <div
                key={p.id}
                draggable={isReorderMode}
                onDragStart={(e) => onDragStart(e, index)}
                onDragOver={(e) => onDragOver(e, index)}
                onDragEnd={onDragEnd}
                className={`flex items-center gap-4 p-3 bg-card border-2 transition-all rounded-2xl group ${
                  isReorderMode 
                    ? "cursor-grab active:cursor-grabbing hover:border-accent/30" 
                    : "hover:border-primary/20"
                } ${isDragging ? "opacity-30 border-accent" : "border-border shadow-sm"}`}
              >
                {isReorderMode && (
                  <div className="flex flex-col items-center gap-1 px-1">
                    <GripVertical className="text-muted-foreground/40 group-hover:text-accent transition-colors" />
                    <span className="text-[10px] font-black text-muted-foreground/30">#{index + 1}</span>
                  </div>
                )}

                <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center overflow-hidden border border-border/50 shrink-0">
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl">{p.emoji || "🧴"}</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-foreground truncate">{p.name}</h3>
                    {p.isNew && (
                      <span className="text-[9px] bg-nuevo text-accent-foreground px-1.5 py-0.5 rounded-full font-black uppercase">Nuevo</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">{p.brand}</p>
                </div>

                {!isReorderMode && (
                  <div className="text-right shrink-0 hidden sm:block">
                    {hasDiscount ? (
                      <div className="flex flex-col">
                        <span className="text-accent font-black">{formatPrice(p.discountPrice!)}</span>
                        <span className="text-[10px] text-muted-foreground line-through decoration-destructive/50">{formatPrice(p.price)}</span>
                      </div>
                    ) : (
                      <span className="font-bold">{formatPrice(p.price)}</span>
                    )}
                  </div>
                )}

                <div className="flex gap-1 shrink-0">
                  {!isReorderMode ? (
                    <>
                      <Link
                        to={`/admin/products/edit/${p.id}`}
                        className="p-2 hover:bg-muted rounded-xl text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Pencil className="w-5 h-5" />
                      </Link>
                      <button
                        onClick={() => handleDelete(p.id!, p.name)}
                        disabled={deleting === p.id}
                        className="p-2 hover:bg-destructive/10 rounded-xl text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </>
                  ) : (
                    <div className="p-2 text-accent/50 group-hover:text-accent transition-colors">
                      <MoveIcon />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MoveIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M2 12h20M12 2v20"/>
    </svg>
  );
}
;
}
