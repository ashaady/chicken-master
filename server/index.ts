import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import {
  handlePaydunya_Initialize,
  handlePaydunya_Callback,
  handlePaydunya_Status,
} from "./routes/paydunya";
import {
  handleCreateOrder,
  handleGetOrder,
  handleUpdateOrder,
  handleCreatePayment,
  handleGetPayment,
  handleUpdatePayment,
  handleGetPaymentByOrderId,
  handleGetAllOrders,
  handleGetAllPayments,
} from "./routes/orders";
import {
  handleAdminLogin,
  handleCheckSession,
  handleGetAdminUser,
} from "./routes/admin";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Debug middleware for API calls
  app.use((req, res, next) => {
    if (req.path.startsWith("/api/")) {
      console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.path}`);
      if (req.method === "POST" || req.method === "PUT") {
        console.log("Request body:", JSON.stringify(req.body, null, 2));
      }
    }

    const originalJson = res.json.bind(res);
    res.json = function(data) {
      if (req.path.startsWith("/api/")) {
        console.log(`Response for ${req.method} ${req.path}:`, JSON.stringify(data, null, 2));
      }
      return originalJson(data);
    };

    next();
  });

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Orders routes
  app.post("/api/orders", handleCreateOrder);
  app.get("/api/orders/:orderId", handleGetOrder);
  app.put("/api/orders/:orderId", handleUpdateOrder);
  app.get("/api/orders/admin/all", handleGetAllOrders);

  // Payments routes
  app.post("/api/payments", handleCreatePayment);
  app.get("/api/payments/:paymentId", handleGetPayment);
  app.put("/api/payments/:paymentId", handleUpdatePayment);
  app.get("/api/payments/by-order/:orderId", handleGetPaymentByOrderId);
  app.get("/api/payments/admin/all", handleGetAllPayments);

  // PayDunya routes
  app.post("/api/paydunya/initialize", handlePaydunya_Initialize);
  app.post("/api/paydunya/callback", handlePaydunya_Callback);
  app.get("/api/paydunya/status/:orderId", handlePaydunya_Status);
  app.get("/api/paydunya/verify/:token", handlePaydunya_Status);

  // Admin routes
  app.post("/api/admin/login", handleAdminLogin);
  app.post("/api/admin/check-session", handleCheckSession);
  app.get("/api/admin/user/:userId", handleGetAdminUser);

  return app;
}
