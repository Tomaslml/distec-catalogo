import heroBg from "@/assets/hero-bg.jpg";

export default function Hero() {
  const scrollToProducts = () => {
    document.getElementById("productos")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative overflow-hidden min-h-[280px] md:min-h-[400px] py-16 md:py-28">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroBg})` }}
      />
      {/* Mobile: gradiente de arriba hacia abajo | Desktop: de izquierda a derecha - Menos opacidad para ver mejor la imagen */}
      <div className="absolute inset-0 bg-gradient-to-b md:bg-gradient-to-r from-background/50 via-background/20 to-transparent" />
      <div className="container mx-auto px-4 text-center relative z-10">
        <h2 className="font-heading text-3xl sm:text-4xl md:text-6xl font-bold text-foreground mb-4">
          Tu cabello, nuestra pasión
        </h2>
        <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Productos profesionales para vos.
        </p>
        <button
          onClick={scrollToProducts}
          className="bg-primary text-primary-foreground px-6 md:px-8 py-3 rounded-full font-semibold text-base md:text-lg hover:opacity-90 transition-opacity shadow-lg"
        >
          Ver productos
        </button>
      </div>
    </section>
  );
}
