import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Layout from "@/components/Layout";
import ProductCard from "@/components/ProductCard";
import CartDrawer from "@/components/CartDrawer";
import ProductQuickAdd from "@/components/ProductQuickAdd";
import { toast } from "sonner";
import { DRINKS_LIST } from "@/lib/drinks";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  is_featured: boolean;
  is_top_product: boolean;
}

interface CartItem {
  id: string;
  product_id: string;
  product_name: string;
  price: number;
  quantity: number;
  image_url: string;
  selected_drink?: string;
  delivery_type?: "livraison" | "emporter";
  delivery_zone?: string;
}

const mockProducts: Product[] = [
  {
    id: "1",
    name: "Menu Classique",
    description: "4 pièces de poulet croustillant + frites + boisson",
    price: 4500,
    image_url:
      "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=500&h=500&fit=crop",
    category: "menus",
    is_featured: true,
    is_top_product: true,
  },
  {
    id: "2",
    name: "Menu Famille",
    description: "12 pièces + 2 grandes frites + 4 boissons",
    price: 12000,
    image_url:
      "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=500&h=500&fit=crop",
    category: "menus",
    is_featured: true,
    is_top_product: false,
  },
  {
    id: "3",
    name: "Menu Solo",
    description: "2 pièces de poulet + petite frite + boisson",
    price: 2500,
    image_url:
      "https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=500&h=500&fit=crop",
    category: "menus",
    is_featured: false,
    is_top_product: true,
  },
  {
    id: "4",
    name: "Chicken Burger Master",
    description: "Burger signature avec poulet croustillant et sauce maison",
    price: 3500,
    image_url:
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&h=500&fit=crop",
    category: "burgers",
    is_featured: true,
    is_top_product: true,
  },
  {
    id: "5",
    name: "Double Chicken",
    description: "Double portion de poulet, double fromage, sauce barbecue",
    price: 4500,
    image_url:
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&h=500&fit=crop",
    category: "burgers",
    is_featured: true,
    is_top_product: false,
  },
  {
    id: "6",
    name: "Spicy Chicken",
    description: "Poulet épicé, jalapeños, sauce piquante",
    price: 3800,
    image_url:
      "https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=500&h=500&fit=crop",
    category: "burgers",
    is_featured: false,
    is_top_product: true,
  },
  {
    id: "7",
    name: "Tacos Poulet",
    description: "Tacos garni de poulet croustillant et fromage",
    price: 2500,
    image_url:
      "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=500&h=500&fit=crop",
    category: "tacos",
    is_featured: true,
    is_top_product: false,
  },
  {
    id: "8",
    name: "Wrap Poulet",
    description: "Tortilla avec poulet grillé, légumes frais et sauce caesar",
    price: 2800,
    image_url:
      "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500&h=500&fit=crop",
    category: "tacos",
    is_featured: false,
    is_top_product: true,
  },
  {
    id: "9",
    name: "Frites Classiques",
    description: "Portion généreuse de frites croustillantes",
    price: 1000,
    image_url:
      "https://images.unsplash.com/photo-1576107232684-1279f390859f?w=500&h=500&fit=crop",
    category: "snacks",
    is_featured: false,
    is_top_product: false,
  },
  {
    id: "10",
    name: "Frites Sauce",
    description: "Frites accompagnées de 3 sauces au choix",
    price: 1500,
    image_url:
      "https://images.unsplash.com/photo-1630431341973-02e1bb7a6408?w=500&h=500&fit=crop",
    category: "snacks",
    is_featured: true,
    is_top_product: false,
  },
];

// Boissons générées à partir de DRINKS_LIST avec images variées
const drinkImages: Record<string, string> = {
  "coca-cola":
    "data:image/jpeg;base64,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",
  "fanta-orange": "https://www.coca-cola.com/fr/fr/brands/fanta",
  sprite:
    "https://www.amazon.fr/Sprite-Lot-24-canettes-1000032673/dp/B01CFWDXQ8",
  water:
    "https://images.unsplash.com/photo-1584181481395-e51c453e31fe?w=500&h=500&fit=crop",
  juice:
    "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=500&h=500&fit=crop",
  smoothie:
    "https://images.unsplash.com/photo-1595521624512-258cb6284fa5?w=500&h=500&fit=crop",
  bouye:
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS6dasX7o3_9IP7EXyvVnxTRMiNUbDKR5EtzQ&s",
  ginger:
    "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=500&h=500&fit=crop",
};

const MOCK_DRINKS = DRINKS_LIST.map((drink, idx) => {
  const drinkKey = drink.name.toLowerCase().replace(" ", "-");
  const defaultDrinkImages = [
    "https://images.unsplash.com/photo-1554866585-c4db0b2feeb0?w=500&h=500&fit=crop",
    "https://images.unsplash.com/photo-1608889335941-33ac46e45519?w=500&h=500&fit=crop",
    "https://images.unsplash.com/photo-1623022227313-c5c5ff70a47f?w=500&h=500&fit=crop",
    "https://images.unsplash.com/photo-1584181481395-e51c453e31fe?w=500&h=500&fit=crop",
    "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=500&h=500&fit=crop",
    "https://images.unsplash.com/photo-1595521624512-258cb6284fa5?w=500&h=500&fit=crop",
  ];

  return {
    id: `drink-${drink.id}`,
    name: drink.name,
    description: `Boisson ${drink.name.toLowerCase()}`,
    price: 500,
    image_url:
      drinkImages[drinkKey] ||
      defaultDrinkImages[idx % defaultDrinkImages.length],
    category: "drinks" as const,
    is_featured: false,
    is_top_product: false,
  };
});

const allProducts = [...mockProducts, ...MOCK_DRINKS];

const filterOptions = [
  { id: "all", label: "Tout 🍽️" },
  { id: "menus", label: "Menus 📦" },
  { id: "burgers", label: "Burgers 🍔" },
  { id: "tacos", label: "Tacos & Wraps 🌮" },
  { id: "snacks", label: "Snacks 🍟" },
  { id: "drinks", label: "Boissons 🥤" },
];

export default function Menu() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const activeFilter = searchParams.get("category") || "all";

  const filteredProducts = useMemo(() => {
    if (activeFilter === "all") {
      return allProducts;
    }
    return allProducts.filter((p) => p.category === activeFilter);
  }, [activeFilter]);

  const handleFilterChange = (filterId: string) => {
    setSearchParams(filterId === "all" ? {} : { category: filterId });
  };

  const handleAddToCart = (product: Product) => {
    // Pour les boissons, ajouter directement sans popup
    if (product.category === "drinks") {
      const newItem: CartItem = {
        id: `${product.id}-${Date.now()}`,
        product_id: product.id,
        product_name: product.name,
        price: product.price,
        quantity: 1,
        image_url: product.image_url,
      };
      setCartItems((prev) => [...prev, newItem]);
      toast.success("Produit ajouté au panier");
      setDrawerOpen(true);
    } else {
      // Pour les autres produits, afficher le popup
      setSelectedProduct(product);
      setQuickAddOpen(true);
    }
  };

  const handleQuickAddProduct = (
    deliveryType: "livraison" | "emporter",
    drinkName?: string,
    zone?: string,
  ) => {
    if (selectedProduct) {
      const newItem: CartItem = {
        id: `${selectedProduct.id}-${Date.now()}`,
        product_id: selectedProduct.id,
        product_name: selectedProduct.name,
        price: selectedProduct.price,
        quantity: 1,
        image_url: selectedProduct.image_url,
        selected_drink: drinkName,
        delivery_type: deliveryType,
        delivery_zone: zone,
      };

      setCartItems((prev) => [...prev, newItem]);
      toast.success("Produit ajouté au panier");
      setDrawerOpen(true);
      setSelectedProduct(null);
      setQuickAddOpen(false);
    }
  };

  const handleUpdateQuantity = (itemId: string, quantity: number) => {
    if (quantity === 0) {
      handleRemoveItem(itemId);
    } else {
      setCartItems((prev) =>
        prev.map((item) => (item.id === itemId ? { ...item, quantity } : item)),
      );
    }
  };

  const handleRemoveItem = (itemId: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== itemId));
    toast.success("Produit retiré du panier");
  };

  return (
    <Layout cartCount={cartItems.length}>
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary to-red-700 text-white py-8 md:py-12">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-black mb-2">Notre Menu</h1>
          <p className="text-lg text-white/90">
            Découvrez toutes nos délicieuses spécialités
          </p>
        </div>
      </div>

      {/* Sticky Filter Tabs */}
      <div className="sticky top-16 z-30 bg-white border-b border-border shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex gap-2 overflow-x-auto py-3 scrollbar-hide">
            {filterOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => handleFilterChange(option.id)}
                className={`px-4 py-2 rounded-full font-semibold text-sm whitespace-nowrap transition-all duration-200 flex-shrink-0 ${
                  activeFilter === option.id
                    ? "bg-primary text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <section className="py-8 md:py-12 px-4 bg-chicken-gray">
        <div className="container mx-auto">
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4 md:gap-6">
              <AnimatePresence mode="popLayout">
                {filteredProducts.map((product, idx) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <ProductCard
                      id={product.id}
                      name={product.name}
                      description={product.description}
                      price={product.price}
                      imageUrl={product.image_url}
                      isFeatured={product.is_featured}
                      onAddClick={() => handleAddToCart(product)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-2xl font-bold text-foreground mb-2">
                Aucun produit
              </h3>
              <p className="text-muted-foreground">
                Aucun produit dans cette catégorie
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Cart Drawer */}
      <CartDrawer
        open={drawerOpen}
        items={cartItems}
        onOpenChange={setDrawerOpen}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onCheckout={() => {
          // This will be handled in app routing
        }}
      />

      {/* Quick Add Product Dialog */}
      <ProductQuickAdd
        product={selectedProduct}
        isOpen={quickAddOpen}
        onClose={() => {
          setQuickAddOpen(false);
          setSelectedProduct(null);
        }}
        onAdd={handleQuickAddProduct}
      />
    </Layout>
  );
}
