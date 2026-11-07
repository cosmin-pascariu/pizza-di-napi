import type { MenuItem } from "./types";

export const DELIVERY_FEE = 2.5;
export const FREE_DELIVERY_FROM = 30;

/** All pizza and bread doughs use the same flour, rested for 48 hours. */
export const PIZZA_FLOUR = "Italian Tipo 00";

/*
 * Calories are estimates for the whole portion (a 30 cm Neapolitan pizza uses a
 * ~250 g dough ball). Allergens follow the 14 EU allergens; our kitchen also
 * handles nuts and sesame, so traces are always possible.
 */
export const MENU_SEED: MenuItem[] = [
  {
    id: "margherita",
    image: "/images/margherita.webp",
    name: "Margherita",
    description:
      "The Neapolitan classic: San Marzano DOP tomato, fior di latte mozzarella, fresh basil and a drizzle of extra-virgin olive oil on a soft, blistered crust.",
    price: 8.5,
    category: "pizza",
    emoji: "🍕",
    tags: ["vegetarian", "bestseller"],
    available: true,
    flour: PIZZA_FLOUR,
    kcal: 820,
    portion: "30 cm",
    allergens: ["gluten", "milk"],
  },
  {
    id: "diavola",
    image: "/images/diavola.webp",
    name: "Diavola",
    description:
      "San Marzano tomato, fior di latte and spicy Calabrian salame that crisps at the edges in the wood fire, finished with a little chili oil.",
    price: 10.5,
    category: "pizza",
    emoji: "🌶️",
    tags: ["spicy", "bestseller"],
    available: true,
    flour: PIZZA_FLOUR,
    kcal: 960,
    portion: "30 cm",
    allergens: ["gluten", "milk", "sulphites"],
  },
  {
    id: "quattro-formaggi",
    image: "/images/quattro-formaggi.webp",
    name: "Quattro Formaggi",
    description:
      "A white pizza with four Italian cheeses: fior di latte, creamy gorgonzola, aged Parmigiano Reggiano and smoked provola. Rich and deeply savoury.",
    price: 11,
    category: "pizza",
    emoji: "🧀",
    tags: ["vegetarian"],
    available: true,
    flour: PIZZA_FLOUR,
    kcal: 1050,
    portion: "30 cm",
    allergens: ["gluten", "milk"],
  },
  {
    id: "prosciutto-funghi",
    image: "/images/prosciutto-funghi.webp",
    name: "Prosciutto e Funghi",
    description:
      "San Marzano tomato and fior di latte topped with slow-cooked Italian ham and champignon mushrooms sautéed with garlic and parsley.",
    price: 10,
    category: "pizza",
    emoji: "🍄",
    tags: [],
    available: true,
    flour: PIZZA_FLOUR,
    kcal: 900,
    portion: "30 cm",
    allergens: ["gluten", "milk"],
  },
  {
    id: "ortolana",
    image: "/images/ortolana.webp",
    name: "Ortolana",
    description:
      "Fully plant-based: San Marzano tomato, grilled zucchini, roasted peppers and eggplant, cherry tomatoes and a melting soy-based vegan cheese.",
    price: 9.5,
    category: "pizza",
    emoji: "🥬",
    tags: ["vegan", "vegetarian"],
    available: true,
    flour: PIZZA_FLOUR,
    kcal: 760,
    portion: "30 cm",
    allergens: ["gluten", "soy"],
  },
  {
    id: "garlic-bread",
    image: "/images/garlic-bread.webp",
    name: "Garlic Bread",
    description:
      "Our pizza dough baked as a focaccia, brushed with garlic butter and parsley straight out of the oven. Made for sharing.",
    price: 4,
    category: "sides",
    emoji: "🥖",
    tags: ["vegetarian"],
    available: true,
    flour: PIZZA_FLOUR,
    kcal: 430,
    portion: "6 pieces",
    allergens: ["gluten", "milk"],
  },
  {
    id: "caesar-salad",
    image: "/images/caesar-salad.webp",
    name: "Caesar Salad",
    description:
      "Crisp romaine, shaved Parmigiano Reggiano and croutons from our own dough, tossed in a classic Caesar dressing with anchovy and lemon.",
    price: 6.5,
    category: "sides",
    emoji: "🥗",
    tags: [],
    available: true,
    kcal: 390,
    portion: "250 g",
    allergens: ["gluten", "milk", "eggs", "fish", "mustard"],
  },
  {
    id: "lemonade",
    image: "/images/lemonade.webp",
    name: "House Lemonade",
    description: "Squeezed to order with fresh lemons, lime, mint and a touch of cane sugar.",
    price: 3.5,
    category: "drinks",
    emoji: "🍋",
    tags: ["vegan", "vegetarian"],
    available: true,
    kcal: 170,
    portion: "500 ml",
    allergens: [],
  },
  {
    id: "cola",
    image: "/images/cola.webp",
    name: "Cola",
    description: "Classic cola, served ice-cold.",
    price: 2.5,
    category: "drinks",
    emoji: "🥤",
    tags: ["vegan", "vegetarian"],
    available: true,
    kcal: 140,
    portion: "330 ml",
    allergens: [],
  },
  {
    id: "tiramisu",
    image: "/images/tiramisu.webp",
    name: "Tiramisù",
    description:
      "Savoiardi soaked in espresso, layered with mascarpone cream and dusted with cocoa. Made fresh every morning.",
    price: 5,
    category: "desserts",
    emoji: "🍰",
    tags: ["vegetarian"],
    available: true,
    kcal: 450,
    portion: "150 g",
    allergens: ["gluten", "milk", "eggs"],
  },
];
