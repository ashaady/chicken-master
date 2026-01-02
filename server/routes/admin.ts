import { RequestHandler } from "express";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), ".data");
const ADMIN_USERS_FILE = path.join(DATA_DIR, "admin-users.json");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export interface AdminUser {
  id: string;
  email: string;
  password: string; // In production, use bcrypt
  name: string;
  role: "admin" | "manager";
  is_active: boolean;
  last_login?: string;
  created_at: string;
}

// Load admin users from file
function loadAdminUsers(): AdminUser[] {
  try {
    ensureDataDir();
    if (fs.existsSync(ADMIN_USERS_FILE)) {
      const data = fs.readFileSync(ADMIN_USERS_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Error loading admin users:", error);
  }
  return [];
}

// Save admin users to file
function saveAdminUsers(users: AdminUser[]) {
  try {
    ensureDataDir();
    fs.writeFileSync(ADMIN_USERS_FILE, JSON.stringify(users, null, 2));
  } catch (error) {
    console.error("Error saving admin users:", error);
  }
}

// Initialize default admin users if they don't exist
function initializeDefaultUsers() {
  const users = loadAdminUsers();
  
  if (users.length === 0) {
    const defaultUsers: AdminUser[] = [
      {
        id: "manager-001",
        email: "manager@chickenmaster.com",
        password: "Manager2026!",
        name: "Chef Manager",
        role: "manager",
        is_active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: "admin-001",
        email: "admin@chickenmaster.com",
        password: "Admin2026!",
        name: "Employé Admin",
        role: "admin",
        is_active: true,
        created_at: new Date().toISOString(),
      },
    ];
    
    saveAdminUsers(defaultUsers);
    console.log("✅ Default admin users created");
  }
}

// Call this once when the server starts
initializeDefaultUsers();

/**
 * POST /api/admin/login
 * Authenticate admin user
 */
export const handleAdminLogin: RequestHandler = (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password are required",
      });
    }

    const users = loadAdminUsers();
    const user = users.find(
      (u) => u.email === email && u.is_active
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Email or password incorrect",
      });
    }

    // In production, use bcrypt.compare()
    if (user.password !== password) {
      return res.status(401).json({
        success: false,
        error: "Email or password incorrect",
      });
    }

    // Update last login
    const updatedUsers = users.map((u) =>
      u.id === user.id
        ? { ...u, last_login: new Date().toISOString() }
        : u
    );
    saveAdminUsers(updatedUsers);

    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = user;
    return res.json({
      success: true,
      user: userWithoutPassword,
      session: {
        user_id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        logged_in_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      error: "Login failed",
    });
  }
};

/**
 * POST /api/admin/check-session
 * Verify if session is valid
 */
export const handleCheckSession: RequestHandler = (req, res) => {
  try {
    const { user_id, logged_in_at } = req.body;

    if (!user_id || !logged_in_at) {
      return res.status(400).json({
        success: false,
        valid: false,
        error: "Missing session data",
      });
    }

    // Check if session expired (24 hours)
    const loginTime = new Date(logged_in_at);
    const now = new Date();
    const hoursSinceLogin = (now.getTime() - loginTime.getTime()) / 1000 / 60 / 60;

    if (hoursSinceLogin > 24) {
      return res.json({
        success: true,
        valid: false,
        reason: "Session expired",
      });
    }

    // Verify user still exists and is active
    const users = loadAdminUsers();
    const user = users.find((u) => u.id === user_id && u.is_active);

    if (!user) {
      return res.json({
        success: true,
        valid: false,
        reason: "User not found or inactive",
      });
    }

    return res.json({
      success: true,
      valid: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Check session error:", error);
    return res.status(500).json({
      success: false,
      valid: false,
      error: "Session check failed",
    });
  }
};

/**
 * GET /api/admin/user/:userId
 * Get user details
 */
export const handleGetAdminUser: RequestHandler = (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "User ID required",
      });
    }

    const users = loadAdminUsers();
    const user = users.find((u) => u.id === userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    const { password: _, ...userWithoutPassword } = user;
    return res.json(userWithoutPassword);
  } catch (error) {
    console.error("Get user error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to get user",
    });
  }
};
