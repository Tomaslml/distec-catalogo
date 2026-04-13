import heroBg from "@/assets/hero-bg.jpg";

interface HeroProps {
  onShowOffers: () => void;
}

export default function Hero({ onShowOffers }: HeroProps) {
  return (
    <section className="relative overflow-hidden min-h-[280px] md:min-h-[400px] py-16 md:py-28">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroBg})` }}
      />
      {/* Oscurecemos un poco más la imagen con un degradado negro para que resalte el texto blanco */}
      <div className="absolute inset-0 bg-black/40 md:bg-gradient-to-r md:from-black/60 md:to-transparent" />
      <div className="container mx-auto px-4 text-center relative z-10 flex flex-col items-center justify-center">
        <h2 className="font-heading text-3xl sm:text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-md">
          Tu cabello, nuestra pasión
        </h2>
        <p className="text-base sm:text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto drop-shadow-sm">
          Productos profesionales para vos.
        </p>
        
        <button 
          onClick={onShowOffers}
          className="bg-accent/90 backdrop-blur-md text-accent-foreground px-6 py-3 rounded-xl animate-pulse shadow-2xl border border-white/20 hover:scale-105 transition-transform group cursor-pointer"
        >
          <span className="font-bold text-lg md:text-2xl block group-hover:scale-110 transition-transform">
            🔥 OFERTA MARY BOSQUES 🔥
          </span>
          <span className="font-black text-xl md:text-3xl block mt-1">
            ¡2 por $13.000!
          </span>
          <span className="text-xs md:text-sm font-medium mt-2 block opacity-80 decoration-accent-foreground/50">
            Toca aquí para ver todas las ofertas
          </span>
        </button>
      </div>
    </section>
  );
}
