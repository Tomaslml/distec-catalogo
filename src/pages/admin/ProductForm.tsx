import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useProducts } from "@/hooks/useProducts";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Loader2, Upload, X, ImagePlus } from "lucide-react";

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
    } catch (err: any) {
      console.error("Error saving product:", err);
      toast.error("Error al guardar: " + (err.message || "Error desconocido"));
    } finally {
      setSaving(false);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadImage(file);
    }
  };

  const uploadImage = async (file: File) => {
    setSaving(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      setImageUrl(publicUrl);
      toast.success("Imagen subida correctamente");
    } catch (error: any) {
      toast.error("Error al subir imagen: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await uploadImage(file);
    }
  };

  const brands = [...new Set(products.map((p) => p.brand))].sort();

  return (
    <div className="max-w-lg mx-auto pb-10">
      <h1 className="font-heading text-2xl font-bold mb-6">
        {isEdit ? "Editar producto" : "Agregar producto"}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Nombre del producto *" error={errors.name}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            placeholder="Shampoo Hydration"
          />
        </Field>

        <Field label="Marca *" error={errors.brand}>
          <input
            list="brands"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent"
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
              className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="4500"
            />
          </Field>
          <Field label="Precio con descuento" error={errors.discountPrice}>
            <input
              type="number"
              value={discountPrice}
              onChange={(e) => setDiscountPrice(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent"
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
            className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent min-h-[80px] resize-none"
            placeholder="Descripción breve del producto..."
          />
        </Field>

        <Field label="Imagen del producto">
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={onDragOver}
            onDrop={onDrop}
            className={`mt-1 border-2 border-dashed border-border rounded-xl p-4 transition-all cursor-pointer hover:bg-muted/50 group relative overflow-hidden flex flex-col items-center justify-center min-h-[160px] ${
              imageUrl ? "border-accent/40 bg-accent/5" : ""
            }`}
          >
            <input
              type="file"
              className="hidden"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileChange}
            />

            {imageUrl ? (
              <>
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="absolute inset-0 w-full h-full object-contain p-2"
                />
                <div className="absolute inset-0 bg-background/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="flex bg-background/80 rounded-full p-2 shadow-xl border border-border scale-90 group-hover:scale-100 transition-transform">
                    <p className="text-xs font-semibold px-2">Cambiar imagen</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setImageUrl("");
                  }}
                  className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full shadow-lg hover:scale-110 transition-transform z-20"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            ) : (
              <div className="text-center space-y-2 py-4">
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto text-accent group-hover:scale-110 transition-transform">
                  <ImagePlus className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold">Clic para subir o arrastrá acá</p>
                  <p className="text-xs text-muted-foreground">JPG, PNG o WEBP (Máx 1MB)</p>
                </div>
              </div>
            )}
          </div>
        </Field>

        <div className="grid grid-cols-2 gap-3 items-end">
          <Field label="Emoji (si no hay imagen)">
            <input
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent text-center text-xl"
            />
          </Field>
          <label className="flex items-center gap-2 cursor-pointer pb-2.5">
            <input
              type="checkbox"
              checked={isNew}
              onChange={(e) => setIsNew(e.target.checked)}
              className="w-4 h-4 rounded border-border accent-accent"
            />
            <span className="text-sm font-medium">Marcar como NUEVO</span>
          </label>
        </div>

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
      <label className="text-sm font-medium text-foreground block mb-1">{label}</label>
      {children}
      {error && <p className="text-destructive text-xs mt-1">{error}</p>}
    </div>
  );
}
