export default function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground py-8 mt-12">
      <div className="container mx-auto px-4 text-center space-y-3">
        <h3 className="font-heading text-2xl font-bold">Distec</h3>
        <p className="text-sm opacity-80">Tu cabello, nuestra pasión</p>
        <div className="flex items-center justify-center gap-4 text-sm opacity-70">
          <span>💳 Transferencia</span>
          <span>💰 Mercado Pago</span>
          <span>💵 Efectivo</span>
        </div>
        <p className="text-sm opacity-60">📍 Mendoza, Argentina</p>
        <a
          href="https://wa.me/5492616838178"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-sm opacity-80 hover:opacity-100 transition-opacity"
        >
          📱 WhatsApp: +54 9 261 683-8178
        </a>
      </div>
    </footer>
  );
}
