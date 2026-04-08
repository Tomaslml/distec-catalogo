import heroBg from "@/assets/hero-bg.jpg";

export default function Hero() {
  const scrollToProducts = () => {
    document.getElementById("productos")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative overflow-hidden py-20 md:py-28">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroBg})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/70 to-background/50" />
      <div className="container mx-auto px-4 text-center relative z-10">
        <h2 className="font-heading text-4xl md:text-6xl font-bold text-foreground mb-4">
          Tu cabello, nuestra pasión
        </h2>
        <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Productos profesionales para vos. Envíos a todo Mendoza.
        </p>
        <button
          onClick={scrollToProducts}
          className="bg-primary text-primary-foreground px-8 py-3 rounded-full font-semibold text-lg hover:opacity-90 transition-opacity shadow-lg"
        >
          Ver productos
        </button>
      </div>
    </section>
  );
}
