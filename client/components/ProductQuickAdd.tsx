import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Truck, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DAKAR_DELIVERY_ZONES } from "@/lib/dakar-zones";
import { DRINKS_LIST } from "@/lib/drinks";
import { toast } from "sonner";

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

interface ProductQuickAddProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAdd: (drinkName?: string) => void;
}

type Step = "drink-selection" | "confirm";

export default function ProductQuickAdd({
  product,
  isOpen,
  onClose,
  onAdd,
}: ProductQuickAddProps) {
  const [currentStep, setCurrentStep] = useState<Step>("drink-selection");
  const [selectedDrink, setSelectedDrink] = useState("");

  const isMenu = product?.category === "menus";

  const handleDrinkSelect = (drinkId: string) => {
    const drinkName = DRINKS_LIST.find((d) => d.id === drinkId)?.name || "";
    handleAddProduct(drinkName);
  };

  const handleAddProduct = (drinkName?: string) => {
    onAdd(drinkName);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setCurrentStep("drink-selection");
    setSelectedDrink("");
  };

  if (!product) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-primary to-red-700 text-white p-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">{product.name}</h2>
                <p className="text-sm text-white/90">{product.price.toLocaleString()} F</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Product Image */}
            <div className="h-48 overflow-hidden">
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Drink Selection (for menus only) */}
              {isMenu ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <h3 className="font-bold text-lg text-foreground">
                    Choisir une boisson
                  </h3>

                  <div className="grid grid-cols-2 gap-3">
                    {DRINKS_LIST.map((drink) => (
                      <button
                        key={drink.id}
                        onClick={() => handleDrinkSelect(drink.id)}
                        className="p-3 border-2 border-gray-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-all text-center group"
                      >
                        <div className="text-2xl mb-2">{drink.emoji}</div>
                        <p className="font-semibold text-sm text-foreground group-hover:text-primary">
                          {drink.name}
                        </p>
                      </button>
                    ))}
                  </div>

                  <Button
                    onClick={() => handleAddProduct()}
                    className="w-full bg-primary hover:bg-primary/90 h-12 font-semibold"
                  >
                    Ajouter au panier
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <p className="text-foreground text-center">
                    {product.description}
                  </p>
                  <Button
                    onClick={() => handleAddProduct()}
                    className="w-full bg-primary hover:bg-primary/90 h-12 font-semibold"
                  >
                    Ajouter au panier
                  </Button>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
