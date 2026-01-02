import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Phone,
  MessageCircle,
  Check,
  X,
  Download,
  Plus,
  Edit,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import AdminHeader from "@/components/AdminHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AdminSession {
  user_id: string;
  email: string;
  name: string;
  role: "admin" | "manager";
  logged_in_at: string;
}

interface OrderItem {
  product_name: string;
  quantity: number;
  price: number;
  selected_drink?: string;
}

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  items: OrderItem[];
  total: number;
  order_type: "livraison" | "emporter";
  status:
    | "pending"
    | "confirmed"
    | "preparing"
    | "ready"
    | "out_for_delivery"
    | "delivered"
    | "cancelled";
  created_at: string;
  delivery_zone?: string;
  delivery_address?: string;
  landmark?: string;
  payment_id?: string;
}

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  image_url?: string;
  is_active: boolean;
  is_featured?: boolean;
  is_top_product?: boolean;
  created_by?: string;
  created_at: string;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bgColor: string; icon: string }
> = {
  pending: {
    label: "En attente",
    color: "bg-gray-100",
    bgColor: "text-gray-800",
    icon: "⏳",
  },
  confirmed: {
    label: "Confirmée",
    color: "bg-blue-100",
    bgColor: "text-blue-800",
    icon: "✅",
  },
  preparing: {
    label: "En préparation",
    color: "bg-orange-100",
    bgColor: "text-orange-800",
    icon: "👨‍🍳",
  },
  ready: {
    label: "Prête",
    color: "bg-purple-100",
    bgColor: "text-purple-800",
    icon: "📦",
  },
  out_for_delivery: {
    label: "En livraison",
    color: "bg-indigo-100",
    bgColor: "text-indigo-800",
    icon: "🚚",
  },
  delivered: {
    label: "Livrée",
    color: "bg-green-100",
    bgColor: "text-green-800",
    icon: "✅",
  },
  cancelled: {
    label: "Annulée",
    color: "bg-red-100",
    bgColor: "text-red-800",
    icon: "❌",
  },
};

const NEXT_STATUS_MAP: Record<string, string> = {
  pending: "confirmed",
  confirmed: "preparing",
  preparing: "ready",
  ready: "out_for_delivery",
  out_for_delivery: "delivered",
};

type TabType = "overview" | "orders" | "statistics" | "products";

export default function AdminDashboardNew() {
  const navigate = useNavigate();
  const [session, setSession] = useState<AdminSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(
    localStorage.getItem("admin_sound_enabled") !== "false",
  );
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    price: "",
    category: "Menus",
    image_url: "",
    is_featured: false,
    is_top_product: false,
  });

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = () => {
      const sessionStr = localStorage.getItem("admin_session");

      if (!sessionStr) {
        navigate("/admin/login");
        return;
      }

      try {
        const userData = JSON.parse(sessionStr) as AdminSession;

        // Check if session expired (24h)
        const loginTime = new Date(userData.logged_in_at);
        const now = new Date();
        const hoursSinceLogin =
          (now.getTime() - loginTime.getTime()) / 1000 / 60 / 60;

        if (hoursSinceLogin > 24) {
          localStorage.removeItem("admin_session");
          navigate("/admin/login");
          return;
        }

        setSession(userData);
        loadOrders();
        setIsLoading(false);
      } catch (error) {
        console.error("Auth check failed:", error);
        localStorage.removeItem("admin_session");
        navigate("/admin/login");
      }
    };

    checkAuth();
  }, [navigate]);

  // Load orders
  const loadOrders = useCallback(async () => {
    try {
      const response = await fetch("/api/orders/admin/all");
      if (response.ok) {
        const data = await response.json();
        setAllOrders(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Failed to load orders:", error);
    }
  }, []);

  // Auto-refresh orders every 3 seconds
  useEffect(() => {
    if (!session) return;

    const interval = setInterval(loadOrders, 3000);
    return () => clearInterval(interval);
  }, [session, loadOrders]);

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    if (!soundEnabled) return;

    try {
      const audio = new Audio(
        "data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA==",
      );
      audio.play().catch(() => {
        // Silently ignore if sound fails
      });
    } catch (error) {
      // Ignore errors
    }
  }, [soundEnabled]);

  // Handle sound toggle
  const handleSoundToggle = (enabled: boolean) => {
    setSoundEnabled(enabled);
  };

  // Filter orders based on role
  const filteredOrders = useMemo(() => {
    let filtered = [...allOrders];

    // Admin role: only show active orders
    if (session?.role === "admin") {
      filtered = filtered.filter(
        (o) => !["delivered", "cancelled"].includes(o.status),
      );
    }

    // Filter by status
    if (selectedFilter !== "all") {
      const statusGroups: Record<string, string[]> = {
        pending: ["pending"],
        confirmed: ["confirmed"],
        preparing: ["preparing"],
        ready: ["ready"],
        delivery: ["out_for_delivery"],
        completed: ["delivered", "cancelled"],
      };
      const statuses = statusGroups[selectedFilter] || [];
      filtered = filtered.filter((o) => statuses.includes(o.status));
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (o) =>
          o.order_number.toLowerCase().includes(query) ||
          o.customer_name.toLowerCase().includes(query) ||
          o.customer_phone.includes(query),
      );
    }

    // Filter by period
    if (selectedPeriod === "today") {
      const today = new Date().toDateString();
      filtered = filtered.filter(
        (o) => new Date(o.created_at).toDateString() === today,
      );
    } else if (selectedPeriod === "7days") {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      filtered = filtered.filter((o) => new Date(o.created_at) >= weekAgo);
    } else if (selectedPeriod === "30days") {
      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);
      filtered = filtered.filter((o) => new Date(o.created_at) >= monthAgo);
    } else if (selectedPeriod === "custom" && startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59);
      filtered = filtered.filter((o) => {
        const orderDate = new Date(o.created_at);
        return orderDate >= start && orderDate <= end;
      });
    }

    return filtered.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  }, [
    allOrders,
    session?.role,
    selectedFilter,
    searchQuery,
    selectedPeriod,
    startDate,
    endDate,
  ]);

  // Calculate statistics
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const ordersToday = allOrders.filter(
      (o) => new Date(o.created_at) >= today,
    );

    const activeOrders = allOrders.filter(
      (o) => !["delivered", "cancelled"].includes(o.status),
    );

    const revenue = ordersToday
      .filter((o) => o.status !== "cancelled")
      .reduce((sum, o) => sum + o.total, 0);

    const deliveredToday = ordersToday.filter((o) => o.status === "delivered");
    const avgTime = deliveredToday.length
      ? Math.round(
          deliveredToday.reduce((sum, o) => {
            const created = new Date(o.created_at).getTime();
            const now = new Date().getTime();
            return sum + (now - created) / 1000 / 60;
          }, 0) / deliveredToday.length,
        )
      : 0;

    return {
      totalToday: ordersToday.length,
      active: activeOrders.length,
      revenue,
      averageTime: avgTime,
    };
  }, [allOrders]);

  // Chart data: Revenue last 7 days
  const chartData = useMemo(() => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toDateString();

      const dayOrders = allOrders.filter(
        (o) =>
          new Date(o.created_at).toDateString() === dateStr &&
          o.status !== "cancelled",
      );

      const revenue = dayOrders.reduce((sum, o) => sum + o.total, 0);

      data.push({
        date: date.toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "short",
        }),
        revenue,
        orders: dayOrders.length,
      });
    }
    return data;
  }, [allOrders]);

  // Chart data: Status distribution
  const statusChartData = useMemo(() => {
    const statusCount: Record<string, number> = {};
    allOrders.forEach((order) => {
      statusCount[order.status] = (statusCount[order.status] || 0) + 1;
    });

    return Object.entries(statusCount).map(([status, count]) => ({
      name: STATUS_CONFIG[status]?.label || status,
      value: count,
      color: STATUS_CONFIG[status]?.color || "bg-gray-100",
    }));
  }, [allOrders]);

  // Chart data: Top 5 products
  const topProductsData = useMemo(() => {
    const productSales: Record<
      string,
      { name: string; quantity: number; revenue: number }
    > = {};

    allOrders
      .filter((o) => o.status !== "cancelled")
      .forEach((order) => {
        order.items.forEach((item) => {
          if (!productSales[item.product_name]) {
            productSales[item.product_name] = {
              name: item.product_name,
              quantity: 0,
              revenue: 0,
            };
          }
          productSales[item.product_name].quantity += item.quantity;
          productSales[item.product_name].revenue += item.price * item.quantity;
        });
      });

    return Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, [allOrders]);

  // Status colors for chart
  const statusColors: Record<string, string> = {
    pending: "#6B7280",
    confirmed: "#3B82F6",
    preparing: "#F97316",
    ready: "#8B5CF6",
    out_for_delivery: "#6366F1",
    delivered: "#10B981",
    cancelled: "#EF4444",
  };

  // Handle status update
  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setAllOrders((prev) =>
          prev.map((o) =>
            o.id === orderId ? { ...o, status: newStatus as any } : o,
          ),
        );
        setSelectedOrder(null);
        playNotificationSound();
        toast.success(
          `Statut: ${STATUS_CONFIG[newStatus]?.label || newStatus}`,
        );
      } else {
        toast.error("Erreur lors de la mise à jour");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Erreur");
    }
  };

  // Handle product actions
  const handleAddProduct = () => {
    if (!productForm.name || !productForm.price || !productForm.category) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    const newProduct: Product = {
      id: `product-${Date.now()}`,
      name: productForm.name,
      description: productForm.description,
      price: parseFloat(productForm.price),
      category: productForm.category,
      image_url: productForm.image_url,
      is_active: true,
      is_featured: productForm.is_featured,
      is_top_product: productForm.is_top_product,
      created_by: session?.name,
      created_at: new Date().toISOString(),
    };

    setProducts([...products, newProduct]);
    toast.success("Produit ajouté");
    setShowProductForm(false);
    setProductForm({
      name: "",
      description: "",
      price: "",
      category: "Menus",
      image_url: "",
      is_featured: false,
      is_top_product: false,
    });
  };

  const handleDeleteProduct = (productId: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce produit ?")) {
      setProducts(products.filter((p) => p.id !== productId));
      toast.success("Produit supprimé");
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      "N° Commande",
      "Date",
      "Client",
      "Téléphone",
      "Type",
      "Total",
      "Statut",
    ];
    const rows = filteredOrders.map((o) => [
      o.order_number,
      new Date(o.created_at).toLocaleString("fr-FR"),
      o.customer_name,
      o.customer_phone,
      o.order_type === "livraison" ? "Livraison" : "À emporter",
      o.total,
      STATUS_CONFIG[o.status].label,
    ]);

    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${c}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `commandes-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();

    toast.success("📥 Export CSV téléchargé");
  };

  if (isLoading || !session) {
    return (
      <div className="min-h-screen bg-chicken-gray flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🍗</div>
          <p className="text-lg text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-chicken-gray">
      {/* Header */}
      <AdminHeader
        userName={session.name}
        role={session.role}
        soundEnabled={soundEnabled}
        onSoundToggle={handleSoundToggle}
      />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {session.role === "admin" ? (
          // ADMIN ROLE VIEW
          <div className="space-y-8">
            {/* Header */}
            <div>
              <h2 className="text-3xl font-bold mb-2">Commandes en cours</h2>
              <p className="text-muted-foreground">
                {filteredOrders.length} commandes à traiter
              </p>
            </div>

            {/* Search */}
            <div>
              <Input
                placeholder="Rechercher par numéro, client ou téléphone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-md"
              />
            </div>

            {/* Orders Table */}
            <div className="space-y-3">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order, idx) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card
                      className="cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => setSelectedOrder(order)}
                    >
                      <CardContent className="p-4">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                          <div>
                            <p className="font-bold">#{order.order_number}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(order.created_at).toLocaleTimeString(
                                "fr-FR",
                              )}
                            </p>
                          </div>

                          <div>
                            <p className="font-semibold">
                              {order.customer_name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {order.customer_phone}
                            </p>
                          </div>

                          <Badge variant="outline">
                            {order.order_type === "livraison"
                              ? "🚚 Livraison"
                              : "📦 À emporter"}
                          </Badge>

                          <p className="text-lg font-bold text-primary">
                            {order.total.toLocaleString()} F
                          </p>

                          <Badge
                            className={
                              STATUS_CONFIG[order.status]?.color ||
                              "bg-gray-100"
                            }
                          >
                            <span
                              className={
                                STATUS_CONFIG[order.status]?.bgColor ||
                                "text-gray-800"
                              }
                            >
                              {STATUS_CONFIG[order.status]?.label ||
                                order.status}
                            </span>
                          </Badge>

                          {order.status !== "delivered" &&
                            order.status !== "cancelled" && (
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const next = NEXT_STATUS_MAP[order.status];
                                  if (next) handleStatusUpdate(order.id, next);
                                }}
                                className="bg-primary hover:bg-primary/90"
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                            )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground">
                      Aucune commande en cours
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        ) : (
          // MANAGER ROLE VIEW
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as TabType)}
          >
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">📊 Vue d'ensemble</TabsTrigger>
              <TabsTrigger value="orders">📋 Commandes</TabsTrigger>
              <TabsTrigger value="statistics">📈 Statistiques</TabsTrigger>
              <TabsTrigger value="products">🍔 Produits</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-8 mt-8">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    title: "Commandes du jour",
                    value: stats.totalToday,
                    icon: "📊",
                    color: "from-blue-500 to-blue-600",
                  },
                  {
                    title: "En cours",
                    value: stats.active,
                    icon: "⏳",
                    color: "from-orange-500 to-orange-600",
                  },
                  {
                    title: "Chiffre d'affaires",
                    value: `${stats.revenue.toLocaleString()} F`,
                    icon: "💰",
                    color: "from-green-500 to-green-600",
                  },
                  {
                    title: "Temps moyen",
                    value: `${stats.averageTime} min`,
                    icon: "⏱️",
                    color: "from-purple-500 to-purple-600",
                  },
                ].map((stat, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <Card
                      className={`bg-gradient-to-br ${stat.color} text-white`}
                    >
                      <CardContent className="p-6">
                        <p className="text-sm opacity-90 mb-2">{stat.icon}</p>
                        <p className="text-3xl font-bold mb-1">{stat.value}</p>
                        <p className="text-sm opacity-80">{stat.title}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Recent Orders */}
              <div>
                <h3 className="text-xl font-bold mb-4">
                  5 dernières commandes
                </h3>
                <div className="space-y-2">
                  {allOrders.slice(0, 5).map((order) => (
                    <Card
                      key={order.id}
                      className="cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => setSelectedOrder(order)}
                    >
                      <CardContent className="p-4">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                          <div>
                            <p className="font-bold">#{order.order_number}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(order.created_at).toLocaleTimeString(
                                "fr-FR",
                              )}
                            </p>
                          </div>
                          <p className="font-semibold">{order.customer_name}</p>
                          <p className="text-lg font-bold text-primary">
                            {order.total.toLocaleString()} F
                          </p>
                          <Badge
                            className={
                              STATUS_CONFIG[order.status]?.color ||
                              "bg-gray-100"
                            }
                          >
                            <span
                              className={
                                STATUS_CONFIG[order.status]?.bgColor ||
                                "text-gray-800"
                              }
                            >
                              {STATUS_CONFIG[order.status]?.label ||
                                order.status}
                            </span>
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Orders Tab */}
            <TabsContent value="orders" className="space-y-6 mt-8">
              {/* Filters */}
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: "all", label: "Toutes" },
                    { id: "pending", label: "Nouvelles" },
                    { id: "confirmed", label: "Confirmées" },
                    { id: "preparing", label: "Préparation" },
                    { id: "ready", label: "Prêtes" },
                    { id: "delivery", label: "Livraison" },
                    { id: "completed", label: "Terminées" },
                  ].map((filter) => (
                    <Button
                      key={filter.id}
                      variant={
                        selectedFilter === filter.id ? "default" : "outline"
                      }
                      onClick={() => setSelectedFilter(filter.id)}
                    >
                      {filter.label}
                    </Button>
                  ))}
                </div>

                <Input
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-md"
                />

                <Button onClick={handleExportCSV} className="gap-2">
                  <Download className="w-4 h-4" />
                  Export CSV
                </Button>
              </div>

              {/* Orders List */}
              <div className="space-y-3">
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((order, idx) => (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <Card
                        className="cursor-pointer hover:shadow-lg transition-shadow"
                        onClick={() => setSelectedOrder(order)}
                      >
                        <CardContent className="p-4">
                          <div className="flex flex-wrap items-center justify-between gap-4">
                            <div>
                              <p className="font-bold">#{order.order_number}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(order.created_at).toLocaleTimeString(
                                  "fr-FR",
                                )}
                              </p>
                            </div>

                            <div>
                              <p className="font-semibold">
                                {order.customer_name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {order.customer_phone}
                              </p>
                            </div>

                            <Badge variant="outline">
                              {order.order_type === "livraison"
                                ? "🚚 Livraison"
                                : "📦 À emporter"}
                            </Badge>

                            <p className="text-lg font-bold text-primary">
                              {order.total.toLocaleString()} F
                            </p>

                            <Badge
                              className={
                                STATUS_CONFIG[order.status]?.color ||
                                "bg-gray-100"
                              }
                            >
                              <span
                                className={
                                  STATUS_CONFIG[order.status]?.bgColor ||
                                  "text-gray-800"
                                }
                              >
                                {STATUS_CONFIG[order.status]?.label ||
                                  order.status}
                              </span>
                            </Badge>

                            {order.status !== "delivered" &&
                              order.status !== "cancelled" && (
                                <Button
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const next = NEXT_STATUS_MAP[order.status];
                                    if (next)
                                      handleStatusUpdate(order.id, next);
                                  }}
                                  className="bg-primary hover:bg-primary/90"
                                >
                                  <Check className="w-4 h-4" />
                                </Button>
                              )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))
                ) : (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <p className="text-muted-foreground">
                        Aucune commande trouvée
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* Statistics Tab */}
            <TabsContent value="statistics" className="space-y-8 mt-8">
              {/* Period Selection */}
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: "all", label: "Toutes" },
                    { id: "today", label: "Aujourd'hui" },
                    { id: "7days", label: "7 jours" },
                    { id: "30days", label: "30 jours" },
                    { id: "custom", label: "Personnalisé" },
                  ].map((period) => (
                    <Button
                      key={period.id}
                      variant={
                        selectedPeriod === period.id ? "default" : "outline"
                      }
                      onClick={() => setSelectedPeriod(period.id)}
                    >
                      {period.label}
                    </Button>
                  ))}
                </div>

                {selectedPeriod === "custom" && (
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                )}
              </div>

              {/* Charts */}
              <Card>
                <CardHeader>
                  <CardTitle>📈 Évolution du chiffre d'affaires</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="#10B981"
                        strokeWidth={3}
                        name="CA (FCFA)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>📊 Répartition par statut</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={statusChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name} (${value})`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {statusChartData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={
                                statusColors[
                                  Object.keys(statusColors)[index % 7]
                                ] || "#999"
                              }
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>🏆 Top 5 produits</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={topProductsData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="name"
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis />
                        <Tooltip />
                        <Bar
                          dataKey="quantity"
                          fill="#E63946"
                          name="Quantité"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Advanced Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  {
                    label: "Total commandes",
                    value: allOrders.length,
                    icon: "📊",
                    color: "from-blue-500 to-blue-600",
                  },
                  {
                    label: "CA Total",
                    value: `${(allOrders.filter((o) => o.status !== "cancelled").reduce((sum, o) => sum + o.total, 0) / 1000000).toFixed(1)}M F`,
                    icon: "💰",
                    color: "from-green-500 to-green-600",
                  },
                  {
                    label: "Panier moyen",
                    value: `${Math.round(allOrders.reduce((sum, o) => sum + o.total, 0) / (allOrders.length || 1)).toLocaleString()} F`,
                    icon: "🛒",
                    color: "from-purple-500 to-purple-600",
                  },
                ].map((stat, idx) => (
                  <Card
                    key={idx}
                    className={`bg-gradient-to-br ${stat.color} text-white`}
                  >
                    <CardContent className="p-6">
                      <p className="text-2xl mb-2">{stat.icon}</p>
                      <p className="text-sm opacity-90">{stat.label}</p>
                      <p className="text-2xl font-bold mt-2">{stat.value}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Products Tab */}
            <TabsContent value="products" className="space-y-6 mt-8">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">Gestion des produits</h3>
                <Button
                  onClick={() => setShowProductForm(true)}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Nouveau produit
                </Button>
              </div>

              {/* Product Form */}
              {showProductForm && (
                <Card>
                  <CardHeader>
                    <CardTitle>Ajouter un produit</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Input
                      placeholder="Nom du produit"
                      value={productForm.name}
                      onChange={(e) =>
                        setProductForm({ ...productForm, name: e.target.value })
                      }
                    />
                    <Input
                      placeholder="Description"
                      value={productForm.description}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          description: e.target.value,
                        })
                      }
                    />
                    <Input
                      placeholder="Prix (FCFA)"
                      type="number"
                      value={productForm.price}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          price: e.target.value,
                        })
                      }
                    />
                    <select
                      value={productForm.category}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          category: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option>Menus</option>
                      <option>Burgers</option>
                      <option>Tacos</option>
                      <option>Snacks</option>
                      <option>Boissons</option>
                    </select>
                    <Input
                      placeholder="URL de l'image"
                      value={productForm.image_url}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          image_url: e.target.value,
                        })
                      }
                    />
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={productForm.is_featured}
                          onChange={(e) =>
                            setProductForm({
                              ...productForm,
                              is_featured: e.target.checked,
                            })
                          }
                        />
                        Produit vedette
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={productForm.is_top_product}
                          onChange={(e) =>
                            setProductForm({
                              ...productForm,
                              is_top_product: e.target.checked,
                            })
                          }
                        />
                        Top produit
                      </label>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleAddProduct}
                        className="bg-primary hover:bg-primary/90"
                      >
                        Enregistrer
                      </Button>
                      <Button
                        onClick={() => setShowProductForm(false)}
                        variant="outline"
                      >
                        Annuler
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Products List */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.length > 0 ? (
                  products.map((product) => (
                    <Card key={product.id}>
                      <CardContent className="p-4">
                        {product.image_url && (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-full h-32 object-cover rounded-lg mb-4"
                          />
                        )}
                        <h4 className="font-bold mb-1">{product.name}</h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          {product.description}
                        </p>
                        <p className="text-lg font-bold text-primary mb-3">
                          {product.price.toLocaleString()} F
                        </p>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingProduct(product)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteProduct(product.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card className="col-span-full">
                    <CardContent className="p-8 text-center">
                      <p className="text-muted-foreground">
                        Aucun produit ajouté
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* Order Details Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold">
                  Commande #{selectedOrder.order_number}
                </h2>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Column */}
                <div className="md:col-span-2 space-y-6">
                  {/* Order Info */}
                  <div>
                    <h3 className="font-bold text-lg mb-3">Informations</h3>
                    <div className="space-y-2 text-sm">
                      <p>
                        <span className="text-muted-foreground">Statut :</span>{" "}
                        <Badge
                          className={
                            STATUS_CONFIG[selectedOrder.status]?.color ||
                            "bg-gray-100"
                          }
                        >
                          <span
                            className={
                              STATUS_CONFIG[selectedOrder.status]?.bgColor ||
                              "text-gray-800"
                            }
                          >
                            {STATUS_CONFIG[selectedOrder.status]?.label ||
                              selectedOrder.status}
                          </span>
                        </Badge>
                      </p>
                      <p>
                        <span className="text-muted-foreground">Type :</span>{" "}
                        {selectedOrder.order_type === "livraison"
                          ? "🚚 Livraison"
                          : "📦 À emporter"}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Date :</span>{" "}
                        {new Date(selectedOrder.created_at).toLocaleString(
                          "fr-FR",
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Delivery Info */}
                  {selectedOrder.order_type === "livraison" && (
                    <div>
                      <h3 className="font-bold text-lg mb-3">🚚 Livraison</h3>
                      <div className="space-y-2 text-sm bg-blue-50 p-3 rounded-lg">
                        {selectedOrder.delivery_zone && (
                          <p>
                            <span className="text-muted-foreground">
                              Zone :
                            </span>{" "}
                            {selectedOrder.delivery_zone}
                          </p>
                        )}
                        {selectedOrder.landmark && (
                          <p>
                            <span className="text-muted-foreground">
                              Repère :
                            </span>{" "}
                            {selectedOrder.landmark}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Items */}
                  <div>
                    <h3 className="font-bold text-lg mb-3">Articles</h3>
                    <div className="space-y-2">
                      {selectedOrder.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between text-sm border-b pb-2"
                        >
                          <span>
                            {item.quantity}x {item.product_name}
                            {item.selected_drink && ` (${item.selected_drink})`}
                          </span>
                          <span className="font-semibold">
                            {(item.price * item.quantity).toLocaleString()} F
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Customer Info */}
                  <div>
                    <h3 className="font-bold text-lg mb-3">👤 Client</h3>
                    <div className="space-y-2 text-sm">
                      <p>
                        <span className="text-muted-foreground">Nom :</span>{" "}
                        {selectedOrder.customer_name}
                      </p>
                      <p>
                        <span className="text-muted-foreground">
                          Téléphone :
                        </span>{" "}
                        {selectedOrder.customer_phone}
                      </p>
                    </div>
                  </div>

                  {/* Total */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">Total</p>
                    <p className="text-3xl font-bold text-primary">
                      {selectedOrder.total.toLocaleString()} F
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2">
                    <a
                      href={`tel:${selectedOrder.customer_phone}`}
                      className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg font-semibold transition-colors"
                    >
                      <Phone className="w-4 h-4" />
                      Appeler
                    </a>
                    <a
                      href={`https://wa.me/${selectedOrder.customer_phone.replace(/\s/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg font-semibold transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" />
                      WhatsApp
                    </a>

                    {selectedOrder.status !== "delivered" &&
                      selectedOrder.status !== "cancelled" && (
                        <Button
                          onClick={() => {
                            const next = NEXT_STATUS_MAP[selectedOrder.status];
                            if (next)
                              handleStatusUpdate(selectedOrder.id, next);
                          }}
                          className="w-full bg-primary text-white hover:bg-primary/90"
                        >
                          Étape suivante
                        </Button>
                      )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
