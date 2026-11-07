export type Category = "pizza" | "sides" | "drinks" | "desserts";

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number; // EUR
  category: Category;
  emoji: string;
  /** Photo path under /public; items added later without a photo fall back to the emoji. */
  image?: string;
  tags: ("vegetarian" | "vegan" | "spicy" | "bestseller")[];
  available: boolean;
  /** Flour used for the dough, e.g. "Italian Tipo 00" (doughs and breads only). */
  flour?: string;
  /** Approximate energy for the whole portion. */
  kcal?: number;
  /** Portion size shown next to the calories, e.g. "30 cm", "500 ml". */
  portion?: string;
  /** EU allergens the item contains (Regulation 1169/2011). */
  allergens?: Allergen[];
}

export type Allergen =
  | "gluten"
  | "milk"
  | "eggs"
  | "fish"
  | "soy"
  | "mustard"
  | "celery"
  | "nuts"
  | "sulphites";

export const ALLERGEN_LABEL: Record<Allergen, string> = {
  gluten: "Gluten (wheat)",
  milk: "Milk",
  eggs: "Eggs",
  fish: "Fish",
  soy: "Soy",
  mustard: "Mustard",
  celery: "Celery",
  nuts: "Tree nuts",
  sulphites: "Sulphites",
};

export interface CartLine {
  itemId: string;
  quantity: number;
}

export type OrderStatus =
  | "pending_payment"
  | "received"
  | "preparing"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export interface OrderLine {
  itemId: string;
  name: string;
  unitPrice: number;
  quantity: number;
}

export interface Customer {
  name: string;
  phone: string;
  address: string;
  notes?: string;
}

export interface Order {
  id: string;
  createdAt: string;
  updatedAt: string;
  lines: OrderLine[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  currency: "EUR";
  customer: Customer;
  status: OrderStatus;
  paypalOrderId?: string;
  paypalCaptureId?: string;
  /** Set when the kitchen cancels a paid order and the payment is refunded through PayPal. */
  refund?: {
    paypalRefundId: string;
    status: string;
    amount: number;
    reason: string;
    at: string;
  };
}

export const STATUS_FLOW: OrderStatus[] = [
  "received",
  "preparing",
  "out_for_delivery",
  "delivered",
];

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending_payment: "Awaiting payment",
  received: "Order received",
  preparing: "In the oven",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled and refunded",
};
