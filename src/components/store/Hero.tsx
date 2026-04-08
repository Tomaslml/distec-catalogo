export default function Hero() {
  const scrollToProducts = () => {
    document.getElementById("productos")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/20 py-16 md:py-24">
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 20px, currentColor 20px, currentColor 21px)`,
        }} />
      </div>
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
