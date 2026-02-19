export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  stock: number;
  featured?: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  items: CartItem[];
  customer: {
    name: string;
    phone: string;
    address: string;
  };
  total: number;
  status: "PENDING" | "CONFIRMED" | "SHIPPED" | "DELIVERED";
  paymentStatus: "PENDING" | "PAID" | "FAILED";
  createdAt: string;
}

export const CATEGORIES = [
  "Power Tools",
  "Hand Tools",
  "Plumbing",
  "Electrical",
  "Paint & Supplies",
  "Building Materials",
  "Safety & Workwear",
  "Fasteners",
] as const;
