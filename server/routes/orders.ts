import { Request, Response } from "express";
import fs from "fs";
import path from "path";

// In-memory store (in production, this would be a database)
const ordersStore = new Map();
const paymentsStore = new Map();

// File-based persistence for orders
const DATA_DIR = path.join(process.cwd(), ".data");
const ORDERS_FILE = path.join(DATA_DIR, "orders.json");
const PAYMENTS_FILE = path.join(DATA_DIR, "payments.json");

// Ensure data directory exists
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// Load orders from file
function loadOrders() {
  try {
    ensureDataDir();
    if (fs.existsSync(ORDERS_FILE)) {
      const data = fs.readFileSync(ORDERS_FILE, "utf-8");
      const orders = JSON.parse(data);
      orders.forEach((order: Order) => {
        ordersStore.set(order.id, order);
      });
      console.log(`Loaded ${orders.length} orders from file`);
    }
  } catch (error) {
    console.error("Error loading orders from file:", error);
  }
}

// Load payments from file
function loadPayments() {
  try {
    ensureDataDir();
    if (fs.existsSync(PAYMENTS_FILE)) {
      const data = fs.readFileSync(PAYMENTS_FILE, "utf-8");
      const payments = JSON.parse(data);
      payments.forEach((payment: Payment) => {
        paymentsStore.set(payment.id, payment);
        paymentsStore.set(`payment-for-order-${payment.order_id}`, payment);
      });
      console.log(`Loaded ${payments.length} payments from file`);
    }
  } catch (error) {
    console.error("Error loading payments from file:", error);
  }
}

// Save orders to file
function saveOrders() {
  try {
    ensureDataDir();
    const orders = Array.from(ordersStore.values());
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
  } catch (error) {
    console.error("Error saving orders to file:", error);
  }
}

// Save payments to file
function savePayments() {
  try {
    ensureDataDir();
    const payments = Array.from(paymentsStore.values())
      .filter((p) => !p.id.startsWith("payment-for-order-"));
    fs.writeFileSync(PAYMENTS_FILE, JSON.stringify(payments, null, 2));
  } catch (error) {
    console.error("Error saving payments to file:", error);
  }
}

// Initialize by loading existing data
loadOrders();
loadPayments();

export interface OrderItem {
  product_name: string;
  quantity: number;
  price: number;
  selected_drink?: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  delivery_address?: string;
  delivery_zone?: string;
  landmark?: string;
  items: OrderItem[];
  total: number;
  order_type: "livraison" | "emporter";
  status: string;
  created_at: string;
  payment_id?: string;
}

export interface Payment {
  id: string;
  order_id: string;
  amount: number;
  payment_method: "wave" | "orange-money";
  status: "pending" | "processing" | "completed" | "failed" | "cancelled";
  paydunya_token?: string;
  paydunya_invoice_url?: string;
  customer_name?: string;
  customer_phone?: string;
  paid_at?: string;
  error_message?: string;
  created_at: string;
}

/**
 * Create a new order
 * POST /api/orders
 */
export async function handleCreateOrder(req: Request, res: Response) {
  try {
    const {
      order_number,
      customer_name,
      customer_phone,
      delivery_address,
      delivery_zone,
      landmark,
      items,
      total,
      order_type,
    } = req.body;

    // Validate required fields
    if (!order_number || !customer_name || !items || !total || !order_type) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
      });
    }

    const order: Order = {
      id: `order-${Date.now()}`,
      order_number,
      customer_name,
      customer_phone,
      delivery_address: delivery_address || "",
      delivery_zone: delivery_zone || "",
      landmark: landmark || "",
      items,
      total,
      order_type,
      status: "pending",
      created_at: new Date().toISOString(),
    };

    ordersStore.set(order.id, order);
    saveOrders(); // Persist to file

    console.log("Creating order with ID:", order.id);
    console.log("Order object being returned:", order);
    return res.json(order);
  } catch (error) {
    console.error("Create order error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to create order",
    });
  }
}

/**
 * Get order by ID
 * GET /api/orders/:orderId
 */
export async function handleGetOrder(req: Request, res: Response) {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: "Order ID missing",
      });
    }

    const order = ordersStore.get(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: "Order not found",
      });
    }

    return res.json(order);
  } catch (error) {
    console.error("Get order error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to get order",
    });
  }
}

/**
 * Update order status
 * PUT /api/orders/:orderId
 */
export async function handleUpdateOrder(req: Request, res: Response) {
  try {
    const { orderId } = req.params;
    const updates = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: "Order ID missing",
      });
    }

    const order = ordersStore.get(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: "Order not found",
      });
    }

    const updatedOrder = {
      ...order,
      ...updates,
    };

    ordersStore.set(orderId, updatedOrder);
    saveOrders(); // Persist to file

    return res.json(updatedOrder);
  } catch (error) {
    console.error("Update order error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to update order",
    });
  }
}

/**
 * Create a new payment record
 * POST /api/payments
 */
export async function handleCreatePayment(req: Request, res: Response) {
  try {
    const { order_id, amount, payment_method, customer_name, customer_phone } =
      req.body;

    if (!order_id || !amount || !payment_method) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
      });
    }

    const payment: Payment = {
      id: `payment-${Date.now()}`,
      order_id,
      amount,
      payment_method,
      status: "pending",
      customer_name: customer_name || "",
      customer_phone: customer_phone || "",
      created_at: new Date().toISOString(),
    };

    paymentsStore.set(payment.id, payment);

    // Also store by order_id for quick lookup
    paymentsStore.set(`payment-for-order-${order_id}`, payment);
    savePayments(); // Persist to file

    console.log("Creating payment with ID:", payment.id);
    console.log("Payment object being returned:", payment);
    return res.json(payment);
  } catch (error) {
    console.error("Create payment error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to create payment",
    });
  }
}

/**
 * Get payment by ID
 * GET /api/payments/:paymentId
 */
export async function handleGetPayment(req: Request, res: Response) {
  try {
    const { paymentId } = req.params;

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        error: "Payment ID missing",
      });
    }

    const payment = paymentsStore.get(paymentId);

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: "Payment not found",
      });
    }

    return res.json(payment);
  } catch (error) {
    console.error("Get payment error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to get payment",
    });
  }
}

/**
 * Update payment status
 * PUT /api/payments/:paymentId
 */
export async function handleUpdatePayment(req: Request, res: Response) {
  try {
    const { paymentId } = req.params;
    const updates = req.body;

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        error: "Payment ID missing",
      });
    }

    const payment = paymentsStore.get(paymentId);

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: "Payment not found",
      });
    }

    const updatedPayment = {
      ...payment,
      ...updates,
    };

    paymentsStore.set(paymentId, updatedPayment);
    paymentsStore.set(
      `payment-for-order-${updatedPayment.order_id}`,
      updatedPayment,
    );
    savePayments(); // Persist to file

    return res.json(updatedPayment);
  } catch (error) {
    console.error("Update payment error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to update payment",
    });
  }
}

/**
 * Get payment by order ID
 * GET /api/payments/by-order/:orderId
 */
export async function handleGetPaymentByOrderId(req: Request, res: Response) {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: "Order ID missing",
      });
    }

    const payment = paymentsStore.get(`payment-for-order-${orderId}`);

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: "Payment not found for this order",
      });
    }

    return res.json(payment);
  } catch (error) {
    console.error("Get payment by order error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to get payment",
    });
  }
}

/**
 * Get all orders (for admin dashboard)
 * GET /api/orders/admin/all
 */
export async function handleGetAllOrders(req: Request, res: Response) {
  try {
    const orders = Array.from(ordersStore.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    return res.json(orders);
  } catch (error) {
    console.error("Get all orders error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to get orders",
    });
  }
}

/**
 * Get all payments (for admin dashboard)
 * GET /api/payments/admin/all
 */
export async function handleGetAllPayments(req: Request, res: Response) {
  try {
    const payments = Array.from(paymentsStore.values())
      .filter((p) => !p.id.startsWith("payment-for-order-"))
      .sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    return res.json(payments);
  } catch (error) {
    console.error("Get all payments error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to get payments",
    });
  }
}

export { ordersStore, paymentsStore };
