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
  onAdd: (deliveryType: "livraison" | "emporter", drinkName?: string, zone?: string) => void;
}

type Step = "delivery-type" | "delivery-zone" | "drink-selection";

export default function ProductQuickAdd({
  product,
  isOpen,
  onClose,
  onAdd,
}: ProductQuickAddProps) {
  const [currentStep, setCurrentStep] = useState<Step>("delivery-type");
  const [selectedDeliveryType, setSelectedDeliveryType] = useState<"livraison" | "emporter" | null>(null);
  const [selectedZone, setSelectedZone] = useState("");
  const [selectedDrink, setSelectedDrink] = useState("");

  const isMenu = product?.category === "menus";

  const handleDeliveryTypeSelect = (type: "livraison" | "emporter") => {
    setSelectedDeliveryType(type);

    if (type === "emporter") {
      // À emporter - directly add or show drink selection if menu
      if (isMenu) {
        setCurrentStep("drink-selection");
      } else {
        handleAddProduct(type);
      }
    } else {
      // Livraison - show zone selection
      setCurrentStep("delivery-zone");
    }
  };

  const handleZoneSelect = () => {
    if (!selectedZone) {
      toast.error("Veuillez sélectionner une zone de livraison");
      return;
    }

    if (isMenu) {
      setCurrentStep("drink-selection");
    } else {
      handleAddProduct("livraison");
    }
  };

  const handleDrinkSelect = (drinkId: string) => {
    const drinkName = DRINKS_LIST.find((d) => d.id === drinkId)?.name || "";
    handleAddProduct(selectedDeliveryType || "emporter", drinkName);
  };

  const handleAddProduct = (
    deliveryType: "livraison" | "emporter",
    drinkName?: string,
  ) => {
    onAdd(deliveryType, drinkName, selectedDeliveryType === "livraison" ? selectedZone : undefined);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setCurrentStep("delivery-type");
    setSelectedDeliveryType(null);
    setSelectedZone("");
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
              {/* Step 1: Delivery Type Selection */}
              {currentStep === "delivery-type" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <h3 className="font-bold text-lg text-foreground">
                    Comment souhaitez-vous recevoir votre commande?
                  </h3>

                  <button
                    onClick={() => handleDeliveryTypeSelect("livraison")}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-primary hover:bg-primary/5 transition-all text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                        <Truck className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-bold text-foreground">Livraison</p>
                        <p className="text-sm text-muted-foreground">
                          Nous livrons à votre adresse
                        </p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleDeliveryTypeSelect("emporter")}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-chicken-green hover:bg-chicken-green/5 transition-all text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                        <Package className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <p className="font-bold text-foreground">À emporter</p>
                        <p className="text-sm text-muted-foreground">
                          Retirer sur place
                        </p>
                      </div>
                    </div>
                  </button>
                </motion.div>
              )}

              {/* Step 2: Delivery Zone Selection */}
              {currentStep === "delivery-zone" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <h3 className="font-bold text-lg text-foreground">
                    Sélectionner votre zone de livraison
                  </h3>

                  <select
                    value={selectedZone}
                    onChange={(e) => setSelectedZone(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary bg-white"
                  >
                    <option value="">Choisir une zone...</option>
                    {DAKAR_DELIVERY_ZONES.map((zone) => (
                      <option key={zone} value={zone}>
                        {zone}
                      </option>
                    ))}
                  </select>

                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={() => {
                        setCurrentStep("delivery-type");
                        setSelectedDeliveryType(null);
                      }}
                      variant="outline"
                      className="flex-1"
                    >
                      Retour
                    </Button>
                    <Button
                      onClick={handleZoneSelect}
                      className="flex-1 bg-primary hover:bg-primary/90"
                      disabled={!selectedZone}
                    >
                      Confirmer
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Drink Selection (for menus) */}
              {currentStep === "drink-selection" && isMenu && (
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
                    onClick={() => {
                      if (selectedDeliveryType === "livraison") {
                        setCurrentStep("delivery-zone");
                      } else {
                        setCurrentStep("delivery-type");
                      }
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    Retour
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
