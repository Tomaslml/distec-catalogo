import { X, Trash2, Minus, Plus } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useSettings } from "@/hooks/useSettings";
import { useOrders } from "@/hooks/useOrders";
import { useState } from "react";
import { toast } from "sonner";

export default function CartPanel() {
  const { items, isOpen, setIsOpen, removeItem, updateQty, subtotal, maryBosquesDiscount, totalItems, clearCart } = useCart();
  const { settings } = useSettings();
  const { addOrder } = useOrders();
  const [couponInput, setCouponInput] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponError, setCouponError] = useState(false);

  if (!isOpen) return null;

  const discountPercent = couponApplied ? settings.couponPercent : 0;
  const couponDiscountAmount = Math.round(subtotal * discountPercent / 100);
  const total = subtotal - couponDiscountAmount;

  const formatPrice = (n: number) => "$" + n.toLocaleString("es-AR");

  const applyCoupon = () => {
    if (couponInput.toUpperCase() === settings.couponCode.toUpperCase()) {
      setCouponApplied(true);
      setCouponError(false);
    } else {
      setCouponApplied(false);
      setCouponError(true);
    }
  };

  const handleWhatsAppOrder = async () => {
    const orderItems = items.map((i) => ({
      productId: i.product.id || "",
      name: i.product.name,
      brand: i.product.brand,
      qty: i.qty,
      unitPrice: i.product.discountPrice ?? i.product.price,
      lineTotal: (i.product.discountPrice ?? i.product.price) * i.qty,
    }));

    await addOrder({
      items: orderItems,
      subtotal,
      couponCode: couponApplied ? settings.couponCode : null,
      couponPercent: couponApplied ? settings.couponPercent : null,
      discount: couponDiscountAmount + maryBosquesDiscount,
      total,
      status: "Pendiente",
    });

    const productLines = items
      .map((i) => {
        let price = i.product.discountPrice ?? i.product.price;
        let qty = i.qty;
        let lineNote = "";

        const isMaryBosquesPromo = i.product.brand.toLowerCase().includes("mary bosques") && i.product.price === 7499;
        
        if (isMaryBosquesPromo && qty >= 2) {
          const pairs = Math.floor(qty / 2);
          const totalDiscount = pairs * 1998;
          const lineTotal = (price * qty) - totalDiscount;
          const avgPrice = lineTotal / qty;
          
          return `- ${qty}x ${i.product.name} — ${formatPrice(avgPrice)} c/u (Promo 2x$13.000 aplicada)`;
        }

        return `- ${qty}x ${i.product.name} — ${formatPrice(price)}`;
      })
      .join("\n");

    let couponLine = "";
    if (couponApplied) {
      couponLine = `\n🎟️ *Cupón ${settings.couponCode} (-${settings.couponPercent}%):* -${formatPrice(couponDiscountAmount)}`;
    }

    const paymentMethods = [];
    if (settings.paymentMethods.transfer) paymentMethods.push("Transferencia / CBU");
    if (settings.paymentMethods.mercadopago) paymentMethods.push("Mercado Pago");
    if (settings.paymentMethods.cash) paymentMethods.push("Efectivo en entrega");

    const orderMessage = `🛍️ *Nuevo pedido - ${settings.storeName}*

──────────────────

📦 *Productos:*
${productLines}

──────────────────

💰 *Subtotal:* ${formatPrice(subtotal)}${couponLine}
✅ *TOTAL: ${formatPrice(total)}*

──────────────────

💳 *Medios de pago:*
${paymentMethods.map((m) => `- ${m}`).join("\n")}

🚚 *Envío:* A coordinar por WhatsApp

──────────────────

¡Hola! Me gustaría hacer este pedido 😊`;

    const phone = settings.whatsappNumber;
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(orderMessage)}`;
    window.open(url, "_blank");

    toast.success("¡Pedido enviado por WhatsApp!");
    clearCart();
    setIsOpen(false);
    setCouponApplied(false);
    setCouponInput("");
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-foreground/30 z-50"
        onClick={() => setIsOpen(false)}
      />
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-background z-50 shadow-2xl animate-slide-in-right flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-heading text-xl font-bold">
            Tu carrito 🛍️ <span className="text-sm font-sans font-normal text-muted-foreground">({totalItems} items)</span>
          </h2>
          <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-muted rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <span className="text-5xl mb-4">🛒</span>
            <p className="text-muted-foreground text-lg mb-4">Tu carrito está vacío</p>
            <button
              onClick={() => setIsOpen(false)}
              className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-medium"
            >
              Ver productos
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {items.map((item) => {
                let price = item.product.discountPrice ?? item.product.price;
                const isMaryBosquesPromo = item.product.brand.toLowerCase().includes("mary bosques") && item.product.price === 7499;
                
                if (isMaryBosquesPromo && item.qty >= 2) {
                  const pairs = Math.floor(item.qty / 2);
                  const totalDiscount = pairs * 1998;
                  const lineTotal = (price * item.qty) - totalDiscount;
                  price = lineTotal / item.qty;
                }

                return (
                  <div key={item.product.id} className="flex gap-3 bg-card p-3 rounded-lg border border-border">
                    <div className="w-14 h-14 rounded bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {item.product.imageUrl ? (
                        <img src={item.product.imageUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-2xl">{item.product.emoji}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-base truncate">{item.product.name}</p>
                      <p className="text-xs font-bold text-muted-foreground">{item.product.brand}</p>
                      <div className="flex flex-col">
                        <p className="text-sm font-medium text-accent">{formatPrice(price)} {isMaryBosquesPromo && item.qty >= 2 && <span className="text-[10px] text-accent animate-pulse font-bold">(PROMO)</span>}</p>
                        {isMaryBosquesPromo && item.qty >= 2 && <p className="text-[10px] text-muted-foreground line-through">{formatPrice(item.product.price)}</p>}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <button onClick={() => removeItem(item.product.id!)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="flex items-center gap-1 bg-muted rounded">
                        <button onClick={() => updateQty(item.product.id!, item.qty - 1)} className="px-2 py-0.5 text-sm hover:bg-border rounded-l">
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-sm font-medium">{item.qty}</span>
                        <button onClick={() => updateQty(item.product.id!, item.qty + 1)} className="px-2 py-0.5 text-sm hover:bg-border rounded-r">
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground">{formatPrice(price * item.qty)}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-border p-4 space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Tenés un cupón?"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm rounded-lg bg-muted border-0 focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <button onClick={applyCoupon} className="px-4 py-2 text-sm bg-secondary text-secondary-foreground rounded-lg font-medium hover:opacity-90">
                  Aplicar
                </button>
              </div>
              {couponApplied && (
                <p className="text-sm text-whatsapp font-medium">✓ Cupón aplicado! −{settings.couponPercent}%</p>
              )}
              {couponError && (
                <p className="text-sm text-destructive font-medium">Cupón inválido</p>
              )}

              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatPrice(subtotal + maryBosquesDiscount)}</span>
                </div>
                {maryBosquesDiscount > 0 && (
                   <div className="flex justify-between text-accent font-medium">
                     <span>Promo Mary Bosques (2x$13.000)</span>
                     <span>-{formatPrice(maryBosquesDiscount)}</span>
                   </div>
                )}
                {couponApplied && (
                  <div className="flex justify-between text-whatsapp">
                    <span>Descuento cupón ({settings.couponPercent}%)</span>
                    <span>-{formatPrice(couponDiscountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold pt-1 border-t border-border">
                  <span>TOTAL</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>

              <details className="text-xs text-muted-foreground">
                <summary className="cursor-pointer hover:text-foreground">💳 Medios de pago</summary>
                <p className="mt-1">Transferencia · Mercado Pago · Efectivo</p>
              </details>

              <button
                onClick={handleWhatsAppOrder}
                className="w-full py-3 rounded-lg font-bold text-base flex items-center justify-center gap-2 bg-whatsapp text-primary-foreground hover:opacity-90 transition-opacity"
              >
                📲 Pedir por WhatsApp
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
