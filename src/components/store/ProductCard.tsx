import { useState } from "react";
import { ShoppingCart, Check } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import type { Product } from "@/lib/seedData";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  const hasDiscount = product.discountPrice !== null && product.discountPrice < product.price;
  const discountPercent = hasDiscount
    ? Math.round((1 - product.discountPrice! / product.price) * 100)
    : 0;

  const handleAdd = () => {
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const formatPrice = (n: number) =>
    "$" + n.toLocaleString("es-AR");

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden shadow-sm hover:shadow-md transition-shadow relative group">
      {product.isNew && (
        <span className="absolute top-2 left-2 z-10 bg-nuevo text-accent-foreground text-xs font-bold px-2 py-0.5 rounded">
          NUEVO
        </span>
      )}
      {hasDiscount && (
        <span className="absolute top-2 right-2 z-10 bg-discount text-primary-foreground text-xs font-bold px-2 py-0.5 rounded">
          −{discountPercent}% OFF
        </span>
      )}

      <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <span className="text-5xl">{product.emoji || "🧴"}</span>
        )}
      </div>

      <div className="p-3 space-y-1.5">
        <p className="text-xs uppercase tracking-wider font-bold text-muted-foreground">
          {product.brand}
        </p>
        <h3 className="font-bold text-lg leading-tight text-foreground mb-1">
          {product.name}
        </h3>
        <p className="text-xs text-muted-foreground line-clamp-2">
          {product.description}
        </p>

        <div className="flex items-baseline gap-2 pt-1">
          {hasDiscount ? (
            <>
              <span className="text-muted-foreground text-sm line-through">
                {formatPrice(product.price)}
              </span>
              <span className="text-accent font-bold text-lg">
                {formatPrice(product.discountPrice!)}
              </span>
            </>
          ) : (
            <span className="text-foreground font-bold text-lg">
              {formatPrice(product.price)}
            </span>
          )}
        </div>

        <button
          onClick={handleAdd}
          disabled={added}
          className={`w-full mt-2 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
            added
              ? "bg-whatsapp text-primary-foreground"
              : "bg-primary text-primary-foreground hover:opacity-90"
          }`}
        >
          {added ? (
            <>
              <Check className="w-4 h-4" /> Agregado!
            </>
          ) : (
            <>
              <ShoppingCart className="w-4 h-4" /> Agregar al carrito
            </>
          )}
        </button>
      </div>
    </div>
  );
}
