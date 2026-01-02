import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, Minus, Loader, Truck, Package, ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { orders, payments } from "@/lib/api";
import { DAKAR_DELIVERY_ZONES } from "@/lib/dakar-zones";

interface CartItem {
  id: string;
  product_id: string;
  product_name: string;
  price: number;
  quantity: number;
  image_url: string;
  selected_drink?: string;
}

interface CartDrawerProps {
  open: boolean;
  items: CartItem[];
  onOpenChange: (open: boolean) => void;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onCheckout: () => void;
}

export default function CartDrawer({
  open,
  items,
  onOpenChange,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
}: CartDrawerProps) {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [selectedDeliveryType, setSelectedDeliveryType] = useState<
    "livraison" | "emporter" | null
  >(null);
  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = async (deliveryType: "livraison" | "emporter") => {
    setIsProcessing(true);
    setShowDeliveryModal(false);

    try {
      // Prepare order payload
      const orderPayload = {
        order_number: `CM${Math.random().toString().slice(2, 10)}`,
        customer_name: "Client",
        customer_phone: "",
        items: items.map((item) => ({
          product_name: item.product_name,
          quantity: item.quantity,
          price: item.price,
          selected_drink: item.selected_drink,
        })),
        total,
        order_type: deliveryType,
        status: "pending",
      };

      // Create order via API
      const { data: orderData, error: orderError } =
        await orders.create(orderPayload);

      if (orderError || !orderData) {
        toast.error("Erreur lors de la création de la commande");
        setIsProcessing(false);
        return;
      }

      const orderId = (orderData as any).id;

      // Create payment record via API
      const paymentPayload = {
        order_id: orderId,
        amount: total,
        payment_method: "orange-money" as const,
        status: "pending",
      };

      const { data: paymentData, error: paymentError } =
        await payments.create(paymentPayload);

      if (paymentError || !paymentData) {
        toast.error(
          "Erreur lors de la création de l'enregistrement de paiement",
        );
        setIsProcessing(false);
        return;
      }

      const paymentId = (paymentData as any).id;

      // Navigate to payment page with both order_id and payment_id
      navigate(`/payment?order_id=${orderId}&payment_id=${paymentId}`);
      onOpenChange(false);
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Une erreur est survenue lors du paiement");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-lg flex flex-col p-0">
        <SheetHeader className="px-6 py-4 border-b border-border">
          <SheetTitle className="text-xl">
            Mon Panier <span className="text-primary">({itemCount})</span>
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
            <div className="text-6xl mb-4">🛒</div>
            <h3 className="text-lg font-bold text-foreground mb-2">
              Votre panier est vide
            </h3>
            <p className="text-center text-muted-foreground text-sm mb-6">
              Ajoutez des produits pour commencer votre commande
            </p>
            <Link to="/menu" onClick={() => onOpenChange(false)}>
              <Button className="bg-primary text-white hover:bg-primary/90">
                Voir le menu
              </Button>
            </Link>
          </div>
        ) : (
          <>
            {/* Summary & Validate Button - Moved to top */}
            <div className="border-b border-border px-6 py-4 space-y-3">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-muted-foreground">Sous-total</span>
                  <span className="font-semibold text-foreground">
                    {total.toLocaleString()} F
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-border">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-lg font-bold text-foreground">
                    Total
                  </span>
                  <span className="text-2xl font-bold text-primary">
                    {total.toLocaleString()} F
                  </span>
                </div>

                <Button
                  onClick={() => setShowDeliveryModal(true)}
                  disabled={isProcessing || items.length === 0}
                  className="w-full bg-primary text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed h-12 font-semibold text-base flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Traitement...
                    </>
                  ) : (
                    "Valider la commande"
                  )}
                </Button>
              </div>
            </div>

            {/* Items List */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <AnimatePresence mode="popLayout">
                {items.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex gap-4 mb-4 pb-4 border-b border-border last:border-0"
                  >
                    {/* Image */}
                    <img
                      src={item.image_url}
                      alt={item.product_name}
                      className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                    />

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-foreground text-sm line-clamp-2">
                        {item.product_name}
                      </h4>
                      {item.selected_drink && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Boisson: {item.selected_drink}
                        </p>
                      )}
                      <p className="text-primary font-bold text-sm mt-2">
                        {item.price.toLocaleString()} F
                      </p>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2 mt-2 bg-gray-100 rounded-lg w-fit">
                        <button
                          onClick={() =>
                            onUpdateQuantity(
                              item.id,
                              item.quantity === 1 ? 0 : item.quantity - 1,
                            )
                          }
                          className="p-1 hover:bg-gray-200 transition-colors rounded"
                        >
                          <Minus className="w-4 h-4 text-gray-600" />
                        </button>
                        <span className="w-6 text-center font-semibold text-sm">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            onUpdateQuantity(item.id, item.quantity + 1)
                          }
                          className="p-1 hover:bg-gray-200 transition-colors rounded"
                        >
                          <Plus className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                    </div>

                    {/* Delete Button */}
                    <button
                      onClick={() => onRemoveItem(item.id)}
                      className="flex-shrink-0 p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </>
        )}
      </SheetContent>

      {/* Delivery Type Modal */}
      <Dialog open={showDeliveryModal} onOpenChange={setShowDeliveryModal}>
        <DialogContent className="w-full max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl text-foreground">
              Comment souhaitez-vous recevoir votre commande?
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 pt-4">
            {/* Livraison Option */}
            <button
              onClick={() => {
                setSelectedDeliveryType("livraison");
                handleCheckout("livraison");
              }}
              disabled={isProcessing}
              className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-primary hover:bg-primary/5 transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed"
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

            {/* À emporter Option */}
            <button
              onClick={() => {
                setSelectedDeliveryType("emporter");
                handleCheckout("emporter");
              }}
              disabled={isProcessing}
              className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-chicken-green hover:bg-chicken-green/5 transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed"
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
          </div>
        </DialogContent>
      </Dialog>
    </Sheet>
  );
}
