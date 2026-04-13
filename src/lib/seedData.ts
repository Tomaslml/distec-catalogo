export interface Product {
  id?: string;
  name: string;
  brand: string;
  price: number;
  discountPrice: number | null;
  description: string;
  imageUrl: string;
  emoji: string;
  isNew: boolean;
  sortOrder: number;
  createdAt: Date;
}

export const seedProducts: Omit<Product, "id" | "createdAt">[] = [
  {
    name: "Shampoo Hydration",
    brand: "Wella Professionals",
    price: 4500,
    discountPrice: 3600,
    description: "Shampoo hidratante para cabello seco y dañado. Fórmula profesional con queratina.",
    imageUrl: "",
    emoji: "🧴",
    isNew: false,
  },
  {
    name: "Mascarilla Nutritive",
    brand: "Kérastase",
    price: 8200,
    discountPrice: null,
    description: "Mascarilla nutritiva intensiva para cabello muy seco. Resultados desde la primera aplicación.",
    imageUrl: "",
    emoji: "✨",
    isNew: true,
  },
  {
    name: "Aceite Elixir Ultime",
    brand: "Kérastase",
    price: 6800,
    discountPrice: 5440,
    description: "Aceite sublime para brillo extraordinario. Protección térmica incluida.",
    imageUrl: "",
    emoji: "💧",
    isNew: false,
  },
  {
    name: "Crema de Peinar Curl",
    brand: "L'Oréal Professionnel",
    price: 3200,
    discountPrice: null,
    description: "Define y controla los rulos sin efecto crocante. Hidratación 24hs.",
    imageUrl: "",
    emoji: "🌀",
    isNew: true,
  },
  {
    name: "Tintura Igora Royal",
    brand: "Schwarzkopf",
    price: 2800,
    discountPrice: 2240,
    description: "Coloración permanente profesional. Cobertura total de canas.",
    imageUrl: "",
    emoji: "🎨",
    isNew: false,
  },
  {
    name: "Protector Térmico",
    brand: "Wella Professionals",
    price: 3900,
    discountPrice: null,
    description: "Spray protector hasta 230°C. Ideal para uso con plancha y secador.",
    imageUrl: "",
    emoji: "🔥",
    isNew: false,
  },
  {
    name: "Shampoo Color Extend",
    brand: "L'Oréal Professionnel",
    price: 4100,
    discountPrice: 3280,
    description: "Protege el color y prolonga su duración. Para cabellos teñidos.",
    imageUrl: "",
    emoji: "💜",
    isNew: true,
  },
  {
    name: "Acondicionador Repair",
    brand: "Schwarzkopf",
    price: 3600,
    discountPrice: null,
    description: "Reparación profunda para cabello dañado por procesos químicos.",
    imageUrl: "",
    emoji: "💪",
    isNew: false,
  },
];

export const defaultSettings = {
  storeName: "Distec",
  whatsappNumber: "5492616838178",
  email: "",
  couponCode: "DISTEC10",
  couponPercent: 10,
  paymentMethods: {
    transfer: true,
    mercadopago: true,
    cash: true,
  },
};
