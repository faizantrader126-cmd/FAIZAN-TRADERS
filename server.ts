import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { PRODUCTS, BANNER_SLIDES } from "./src/data";
import { Product, Order, BannerSlide } from "./src/types";

// Database storage file
const DB_FILE = path.join(process.cwd(), "db.json");

interface DatabaseSchema {
  products: Product[];
  slides: BannerSlide[];
  orders: Order[];
  inquiries: {
    id: string;
    name: string;
    phone: string;
    message: string;
    created_at: string;
  }[];
  customLogo: string;
}

// Read database or initialize with seed data
function readDb(): DatabaseSchema {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, "utf-8");
      return JSON.parse(content);
    }
  } catch (err) {
    console.error("Error reading db.json, recreating...", err);
  }

  // Seed default data
  const defaultDb: DatabaseSchema = {
    products: PRODUCTS,
    slides: BANNER_SLIDES,
    orders: [],
    inquiries: [],
    customLogo: ""
  };
  writeDb(defaultDb);
  return defaultDb;
}

function writeDb(data: DatabaseSchema) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing db.json:", err);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware with large limits for base64 / image uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // API Routes: Products
  app.get("/api/products", (req, res) => {
    const db = readDb();
    res.json({ success: true, data: db.products });
  });

  app.post("/api/products", (req, res) => {
    try {
      const db = readDb();
      const newProduct = req.body as Product;
      
      if (!newProduct.id) {
        newProduct.id = "prod_" + Date.now();
      }
      
      // Check if product exists to update it, or add as new
      const index = db.products.findIndex(p => p.id === newProduct.id);
      if (index > -1) {
        db.products[index] = { ...db.products[index], ...newProduct };
      } else {
        db.products.push(newProduct);
      }
      
      writeDb(db);
      res.json({ success: true, data: db.products });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.put("/api/products/:id", (req, res) => {
    try {
      const db = readDb();
      const id = req.params.id;
      const updatedProduct = req.body as Product;
      
      const index = db.products.findIndex(p => p.id === id);
      if (index > -1) {
        db.products[index] = { ...db.products[index], ...updatedProduct };
        writeDb(db);
        res.json({ success: true, data: db.products });
      } else {
        res.status(404).json({ success: false, error: "Product not found" });
      }
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.delete("/api/products/:id", (req, res) => {
    try {
      const db = readDb();
      const id = req.params.id;
      
      db.products = db.products.filter(p => p.id !== id);
      writeDb(db);
      res.json({ success: true, data: db.products });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Bulk overwrite/push products (for restore default or manual upload syncs)
  app.post("/api/products/bulk", (req, res) => {
    try {
      const db = readDb();
      const updatedList = req.body as Product[];
      db.products = updatedList;
      writeDb(db);
      res.json({ success: true, data: db.products });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // API Routes: Slides
  app.get("/api/slides", (req, res) => {
    const db = readDb();
    res.json({ success: true, data: db.slides });
  });

  app.post("/api/slides", (req, res) => {
    try {
      const db = readDb();
      db.slides = req.body as BannerSlide[];
      writeDb(db);
      res.json({ success: true, data: db.slides });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // API Routes: Orders
  app.get("/api/orders", (req, res) => {
    const db = readDb();
    res.json({ success: true, data: db.orders });
  });

  app.post("/api/orders", (req, res) => {
    try {
      const db = readDb();
      const newOrder = req.body as Order;
      if (!newOrder.id) {
        newOrder.id = "order_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
      }
      
      // Push order
      db.orders.unshift(newOrder); // Newest orders first
      writeDb(db);
      res.json({ success: true, data: newOrder });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.put("/api/orders/:id/status", (req, res) => {
    try {
      const db = readDb();
      const id = req.params.id;
      const { status } = req.body as { status: Order["status"] };
      
      const index = db.orders.findIndex(o => o.id === id);
      if (index > -1) {
        db.orders[index].status = status;
        writeDb(db);
        res.json({ success: true, data: db.orders[index] });
      } else {
        res.status(404).json({ success: false, error: "Order not found" });
      }
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // API Routes: Inquiries / Appointments
  app.get("/api/inquiries", (req, res) => {
    const db = readDb();
    res.json({ success: true, data: db.inquiries });
  });

  app.post("/api/inquiries", (req, res) => {
    try {
      const db = readDb();
      const newInquiry = req.body as { name: string; phone: string; message: string };
      const created = {
        id: "inq_" + Date.now(),
        ...newInquiry,
        created_at: new Date().toISOString()
      };
      
      db.inquiries.unshift(created);
      writeDb(db);
      res.json({ success: true, data: created });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // API Routes: Custom Store Logo & Config
  app.get("/api/logo", (req, res) => {
    const db = readDb();
    res.json({ success: true, logo: db.customLogo });
  });

  app.post("/api/logo", (req, res) => {
    try {
      const db = readDb();
      db.customLogo = req.body.logo || "";
      writeDb(db);
      res.json({ success: true, logo: db.customLogo });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Vite Dev Server middleware or production static build serving
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
