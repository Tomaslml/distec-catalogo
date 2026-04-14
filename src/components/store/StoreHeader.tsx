import { ShoppingCart } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useState, useEffect } from "react";

export default function StoreHeader() {
  const { totalItems, setIsOpen } = useCart();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-shadow duration-300 ${
        scrolled ? "shadow-md" : ""
      } bg-background/95 backdrop-blur-sm border-b border-border`}
    >
      <div className="container mx-auto flex items-center justify-between py-2 px-4 h-16 md:h-20">
        <h1 className="font-heading text-3xl md:text-5xl font-bold text-accent tracking-wide uppercase leading-none">
          Distec
        </h1>
        <button
          onClick={() => setIsOpen(true)}
          className="relative p-2 rounded-full hover:bg-muted transition-colors"
          aria-label="Abrir carrito"
        >
          <ShoppingCart className="w-6 h-6 text-foreground" />
          {totalItems > 0 && (
            <span className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-bounce">
              {totalItems}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
