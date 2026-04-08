import { useSettings } from "@/hooks/useSettings";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function AdminSettings() {
  const { settings, loading, saveSettings } = useSettings();
  const [form, setForm] = useState(settings);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await saveSettings(form);
    toast.success("✓ Configuración guardada");
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-accent" /></div>;

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="font-heading text-2xl font-bold mb-6">Configuración</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="bg-card border border-border rounded-lg p-4 space-y-3">
          <h2 className="font-semibold text-sm">🏪 Datos de la tienda</h2>
          <div>
            <label className="text-xs text-muted-foreground">Nombre</label>
            <input value={form.storeName} onChange={(e) => setForm({ ...form, storeName: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-lg bg-muted border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">WhatsApp</label>
            <input value={form.whatsappNumber} onChange={(e) => setForm({ ...form, whatsappNumber: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-lg bg-muted border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Email de notificaciones</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-lg bg-muted border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
          </div>
        </section>

        <section className="bg-card border border-border rounded-lg p-4 space-y-3">
          <h2 className="font-semibold text-sm">🎟️ Cupón de descuento</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Código</label>
              <input value={form.couponCode} onChange={(e) => setForm({ ...form, couponCode: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-lg bg-muted border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent" placeholder="DISTEC10" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Descuento (%)</label>
              <input type="number" value={form.couponPercent} onChange={(e) => setForm({ ...form, couponPercent: Number(e.target.value) })} className="w-full mt-1 px-3 py-2 rounded-lg bg-muted border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
            </div>
          </div>
          {form.couponCode && (
            <p className="text-xs text-accent">Cupón {form.couponCode} → {form.couponPercent}% de descuento</p>
          )}
        </section>

        <section className="bg-card border border-border rounded-lg p-4 space-y-3">
          <h2 className="font-semibold text-sm">💳 Medios de pago</h2>
          {[
            { key: "transfer" as const, label: "Transferencia / CBU" },
            { key: "mercadopago" as const, label: "Mercado Pago" },
            { key: "cash" as const, label: "Efectivo en entrega" },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.paymentMethods[key]}
                onChange={(e) =>
                  setForm({ ...form, paymentMethods: { ...form.paymentMethods, [key]: e.target.checked } })
                }
                className="w-4 h-4 rounded border-border accent-accent"
              />
              <span className="text-sm">{label}</span>
            </label>
          ))}
        </section>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          Guardar configuración ✓
        </button>
      </form>
    </div>
  );
}
