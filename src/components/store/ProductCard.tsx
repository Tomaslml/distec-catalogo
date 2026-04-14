import { useState } from "react";
import { ShoppingCart, Check } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import type { Product } from "@/lib/seedData";
import { isProductEligibleForMaryBosquesPromo } from "@/lib/promoUtils";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const [modalAdded, setModalAdded] = useState(false);

  const isMaryBosques = /bosque/i.test(product.brand);
  const isPromoEligible = isProductEligibleForMaryBosquesPromo(product);
  
  // Usamos el precio de descuento del producto directamente
  const effectiveDiscountPrice = product.discountPrice;

  const hasDiscount = effectiveDiscountPrice !== null && effectiveDiscountPrice < product.price;
  const finalPrice = hasDiscount ? effectiveDiscountPrice! : product.price;
  const discountPercent = hasDiscount
    ? Math.round((1 - effectiveDiscountPrice! / product.price) * 100)
    : 0;

  const handleAdd = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };
  
  const handleModalAdd = () => {
    addItem(product);
    setModalAdded(true);
    setTimeout(() => setModalAdded(false), 1500);
  };

  const formatPrice = (n: number) =>
    "$" + n.toLocaleString("es-AR");

  return (
    <Dialog>
      <div className="bg-card rounded-lg border border-border overflow-hidden shadow-sm hover:shadow-md transition-shadow relative group flex flex-col h-full">
        {product.isNew && (
          <span className="absolute top-2 left-2 z-10 bg-nuevo text-accent-foreground text-xs font-bold px-2 py-0.5 rounded pointer-events-none">
            NUEVO
          </span>
        )}
        {hasDiscount && (
          <span className="absolute top-2 right-2 z-10 bg-discount text-primary-foreground text-xs font-bold px-2 py-0.5 rounded pointer-events-none">
            −{discountPercent}% OFF
          </span>
        )}
        {isProductEligibleForMaryBosquesPromo(product) && (
          <span className="absolute top-2 right-2 z-10 bg-accent text-accent-foreground text-[10px] font-black px-2 py-0.5 rounded animate-pulse shadow-sm border border-white/20 pointer-events-none">
            2 X $13.000
          </span>
        )}

        <DialogTrigger className="text-left w-full focus:outline-none flex flex-col flex-grow">
          <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden w-full relative">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
            ) : (
              <span className="text-5xl">{product.emoji || "🧴"}</span>
            )}
            <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </div>
          <div className="p-3 sm:p-4 flex flex-col flex-1 gap-1 sm:gap-2 overflow-hidden">
            <div className="flex flex-col">
              <span className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-widest mb-0.5 sm:mb-1">
                {product.brand}
              </span>
              <h3 className="font-heading text-base sm:text-xl font-bold leading-tight line-clamp-2 min-h-[2.5rem] sm:min-h-[3rem] group-hover:text-accent transition-colors">
                {product.name}
              </h3>
            </div>
            
            <p className="text-[10px] sm:text-sm text-muted-foreground line-clamp-2 leading-relaxed opacity-80">
              {product.description}
            </p>

            <div className="mt-auto pt-2 sm:pt-4">
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 mb-3 sm:mb-4">
                <div className="flex items-baseline gap-1.5 sm:gap-2 flex-wrap">
                  <span className="text-lg sm:text-2xl font-bold text-foreground">
                    {formatPrice(finalPrice)}
                  </span>
                  {hasDiscount && (
                    <span className="text-[10px] sm:text-sm text-muted-foreground line-through opacity-50">
                      {formatPrice(product.price)}
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={handleAdd}
                disabled={added}
                className={`w-full py-2 sm:py-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md ${
                  added
                    ? "bg-whatsapp text-primary-foreground"
                    : "bg-primary text-primary-foreground hover:opacity-90 active:scale-95 shadow-primary/10"
                }`}
              >
                {added ? (
                  <>
                    <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>Agregado</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>Agregar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </DialogTrigger>
      </div>

      <DialogContent className="sm:max-w-[600px] w-[95vw] overflow-hidden p-0 border-0 bg-background max-h-[90vh] flex flex-col rounded-xl z-50">
        <div className="overflow-y-auto w-full block">
          <div className="aspect-[4/3] bg-muted flex items-center justify-center w-full relative sm:aspect-[16/9]">
            {product.isNew && (
              <span className="absolute top-4 left-4 z-10 bg-nuevo text-accent-foreground text-sm font-bold px-3 py-1 rounded">
                NUEVO
              </span>
            )}
            {hasDiscount && (
              <span className="absolute top-4 right-4 z-10 bg-discount text-primary-foreground text-sm font-bold px-3 py-1 rounded">
                −{discountPercent}% OFF
              </span>
            )}
          
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <span className="text-6xl">{product.emoji || "🧴"}</span>
            )}
          </div>
          
          <div className="p-6 space-y-4">
            <DialogHeader className="text-left space-y-2">
              <p className="text-sm uppercase tracking-wider font-bold text-muted-foreground">
                {product.brand}
              </p>
              <DialogTitle className="text-2xl font-bold leading-tight">{product.name}</DialogTitle>
              <div className="flex flex-wrap items-baseline gap-3 pt-1">
                {hasDiscount ? (
                  <>
                    <span className="text-accent font-black text-3xl">
                      {formatPrice(effectiveDiscountPrice!)}
                    </span>
                    <span className="text-muted-foreground text-lg line-through">
                      {formatPrice(product.price)}
                    </span>
                  </>
                ) : (
                  <span className="text-foreground font-black text-3xl">
                    {formatPrice(product.price)}
                  </span>
                )}
              </div>
            </DialogHeader>

            <DialogDescription className="text-base text-foreground/80 leading-relaxed whitespace-pre-wrap mt-4">
              {product.description}
            </DialogDescription>
            
          </div>
        </div>
        <div className="p-4 bg-background/95 backdrop-blur border-t flex justify-end sticky bottom-0">
           <button
             onClick={handleModalAdd}
             disabled={modalAdded}
             className={`w-full sm:w-auto px-8 py-3 rounded-xl text-base font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 ${
               modalAdded
                 ? "bg-whatsapp text-primary-foreground"
                 : "bg-primary text-primary-foreground hover:opacity-90"
             }`}
           >
             {modalAdded ? (
               <>
                 <Check className="w-5 h-5" /> Agregado al carrito
               </>
             ) : (
               <>
                 <ShoppingCart className="w-5 h-5" /> Agregar al carrito
               </>
             )}
           </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
