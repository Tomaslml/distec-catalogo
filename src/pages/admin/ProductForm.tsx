import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useProducts } from "@/hooks/useProducts";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function ProductForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { products, addProduct, updateProduct } = useProducts();

  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [price, setPrice] = useState("");
  const [discountPrice, setDiscountPrice] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [emoji, setEmoji] = useState("🧴");
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isEdit && products.length > 0) {
      const p = products.find((p) => p.id === id);
      if (p) {
        setName(p.name);
        setBrand(p.brand);
        setPrice(String(p.price));
        setDiscountPrice(p.discountPrice ? String(p.discountPrice) : "");
        setDescription(p.description);
        setImageUrl(p.imageUrl);
        setEmoji(p.emoji);
        setIsNew(p.isNew);
      }
    }
  }, [isEdit, id, products]);

  const priceNum = Number(price);
  const discountNum = discountPrice ? Number(discountPrice) : null;
  const hasDiscount = discountNum !== null && discountNum > 0 && discountNum < priceNum;
  const discountPct = hasDiscount ? Math.round((1 - discountNum! / priceNum) * 100) : 0;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "El nombre es obligatorio";
    if (!brand.trim()) e.brand = "La marca es obligatoria";
    if (!price || priceNum <= 0) e.price = "Ingresá un precio válido";
    if (discountPrice && (discountNum === null || discountNum <= 0)) e.discountPrice = "Precio inválido";
    if (discountNum && discountNum >= priceNum) e.discountPrice = "Debe ser menor al precio original";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    const data = {
      name: name.trim(),
      brand: brand.trim(),
      price: priceNum,
      discountPrice: discountNum && discountNum < priceNum ? discountNum : null,
      description: description.trim(),
      imageUrl: imageUrl.trim(),
      emoji,
      isNew,
    };
    try {
      if (isEdit) {
        await updateProduct(id!, data);
      } else {
        await addProduct(data);
      }
      toast.success("✓ Producto guardado correctamente");
      navigate("/admin/products");
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const brands = [...new Set(products.map((p) => p.brand))].sort();

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="font-heading text-2xl font-bold mb-6">
        {isEdit ? "Editar producto" : "Agregar producto"}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Nombre del producto *" error={errors.name}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-field"
            placeholder="Shampoo Hydration"
          />
        </Field>

        <Field label="Marca *" error={errors.brand}>
          <input
            list="brands"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            className="input-field"
            placeholder="Wella Professionals"
          />
          <datalist id="brands">
            {brands.map((b) => (
              <option key={b} value={b} />
            ))}
          </datalist>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Precio ARS *" error={errors.price}>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="input-field"
              placeholder="4500"
            />
          </Field>
          <Field label="Precio con descuento" error={errors.discountPrice}>
            <input
              type="number"
              value={discountPrice}
              onChange={(e) => setDiscountPrice(e.target.value)}
              className="input-field"
              placeholder="3600"
            />
          </Field>
        </div>

        {hasDiscount && (
          <p className="text-sm text-accent font-medium">
            −{discountPct}% OFF
          </p>
        )}

        <Field label={`Descripción (${description.length}/200)`}>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value.slice(0, 200))}
            className="input-field min-h-[80px] resize-none"
            placeholder="Descripción breve del producto..."
          />
        </Field>

        <Field label="URL de imagen">
          <input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="input-field"
            placeholder="https://..."
          />
          {imageUrl && (
            <img src={imageUrl} alt="Preview" className="mt-2 w-20 h-20 rounded object-cover bg-muted" />
          )}
        </Field>

        <Field label="Emoji alternativo">
          <input
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
            className="input-field w-20 text-center text-2xl"
          />
        </Field>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isNew}
            onChange={(e) => setIsNew(e.target.checked)}
            className="w-4 h-4 rounded border-border accent-accent"
          />
          <span className="text-sm font-medium">Marcar como NUEVO</span>
        </label>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate("/admin/products")}
            className="flex-1 py-2.5 rounded-lg bg-muted text-foreground font-medium hover:bg-muted/80"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Guardar producto ✓
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-sm font-medium text-foreground">{label}</label>
      <div className="mt-1 [&>.input-field]:w-full [&>.input-field]:px-3 [&>.input-field]:py-2 [&>.input-field]:rounded-lg [&>.input-field]:bg-muted [&>.input-field]:border [&>.input-field]:border-border [&>.input-field]:text-sm [&>.input-field]:focus:outline-none [&>.input-field]:focus:ring-2 [&>.input-field]:focus:ring-accent">
        {children}
      </div>
      {error && <p className="text-destructive text-xs mt-1">{error}</p>}
    </div>
  );
}
