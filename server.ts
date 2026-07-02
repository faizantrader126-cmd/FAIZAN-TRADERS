import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { PRODUCTS, BANNER_SLIDES } from "./src/data";
import { Product, Order, BannerSlide, LayoutConfig } from "./src/types";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

// Supabase Connection Credentials (with fallback default configuration)
let SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://vwoqpxljyxqacadnpgfk.supabase.co";
if (SUPABASE_URL && !SUPABASE_URL.startsWith("http://") && !SUPABASE_URL.startsWith("https://")) {
  SUPABASE_URL = `https://${SUPABASE_URL.trim()}.supabase.co`;
}
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_8imO92Hxr2KGilgnAbNsVw_Dho4Vc9q";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

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
  layout?: LayoutConfig;
}

// Read database or initialize with seed data
function readDb(): DatabaseSchema {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, "utf-8");
      const db = JSON.parse(content);
      // Ensure layout exists
      if (!db.layout) {
        db.layout = {
          showSlider: true,
          showCategories: true,
          showFlashSale: true,
          showTrending: true,
          showReviews: true,
          showInquiry: true,
          showFooter: true
        };
        writeDb(db);
      }
      return db;
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
    customLogo: "",
    layout: {
      showSlider: true,
      showCategories: true,
      showFlashSale: true,
      showTrending: true,
      showReviews: true,
      showInquiry: true,
      showFooter: true
    }
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

// Map frontend Product model to Supabase 'products' table columns
function toSupabaseProduct(p: any) {
  return {
    id: p.id,
    name: p.name,
    price: Number(p.price),
    original_price: Number(p.originalPrice || p.original_price || p.price),
    description: p.description || "",
    long_description: p.longDescription || p.long_description || "",
    image: p.image,
    images: Array.isArray(p.images) ? p.images : [],
    rating: Number(p.rating || 5),
    reviews_count: Number(p.reviewsCount || p.reviews_count || 0),
    category: p.category,
    features: Array.isArray(p.features) ? p.features : [],
    variants: Array.isArray(p.variants) ? p.variants : [],
    sizes: Array.isArray(p.sizes) ? p.sizes : [],
    stock: Number(p.stock || 10),
    badge: p.badge || null,
  };
}

// Map row from Supabase 'products' table back to frontend Product model
function fromSupabaseProduct(p: any) {
  return {
    id: p.id,
    name: p.name,
    price: Number(p.price),
    originalPrice: Number(p.original_price ?? p.price),
    description: p.description || "",
    longDescription: p.long_description || "",
    image: p.image || "",
    images: p.images || [],
    rating: Number(p.rating ?? 5),
    reviewsCount: Number(p.reviews_count ?? 0),
    category: p.category,
    features: p.features || [],
    variants: p.variants || [],
    sizes: p.sizes || [],
    stock: Number(p.stock ?? 10),
    badge: p.badge || undefined,
  };
}

// Map frontend Order model to Supabase 'orders' table columns
function toSupabaseOrder(o: any) {
  return {
    order_id: o.id || o.order_id,
    customer_name: o.customerDetails?.name || o.customer_name || "",
    customer_phone: o.customerDetails?.phone || o.customer_phone || "",
    customer_whatsapp: o.customerDetails?.whatsapp || o.customer_whatsapp || "",
    customer_address: o.customerDetails?.address || o.customer_address || "",
    customer_city: o.customerDetails?.city || o.customer_city || "",
    customer_notes: o.customerDetails?.notes || o.customer_notes || "",
    items: o.items || [],
    total_amount: Number(o.totalAmount ?? o.total_amount ?? 0),
    shipping_cost: Number(o.shippingCost ?? o.shipping_cost ?? 0),
    status: o.status || "Pending",
    payment_method: o.paymentMethod || o.payment_method || "COD",
  };
}

// Map row from Supabase 'orders' table back to frontend Order model
function fromSupabaseOrder(o: any) {
  return {
    id: o.order_id,
    customerDetails: {
      name: o.customer_name,
      phone: o.customer_phone,
      whatsapp: o.customer_whatsapp,
      address: o.customer_address,
      city: o.customer_city,
      notes: o.customer_notes,
    },
    items: o.items || [],
    totalAmount: Number(o.total_amount),
    shippingCost: Number(o.shipping_cost),
    status: o.status,
    paymentMethod: o.payment_method,
    date: o.created_at || new Date().toISOString(),
  };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Allow Cross-Origin Resource Sharing (CORS) for external frontends like Vercel
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });

  // Middleware with large limits for base64 / image uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Create uploads directory if it doesn't exist
  const UPLOADS_DIR = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }

  // Serve uploads directory statically
  app.use("/uploads", express.static(UPLOADS_DIR));

  // API Routes: Products
  app.get("/api/products", async (req, res) => {
    try {
      const { data, error } = await supabase.from("products").select("*").order("id", { ascending: true });
      if (error) {
        throw error;
      }
      if (data && data.length > 0) {
        const mapped = data.map(fromSupabaseProduct);
        const db = readDb();
        db.products = mapped;
        writeDb(db);
        return res.json({ success: true, data: mapped });
      } else if (data && data.length === 0) {
        console.log("Supabase products table is empty, seeding default products...");
        const db = readDb();
        if (!db.products || db.products.length === 0) {
          db.products = PRODUCTS;
          writeDb(db);
        }
        
        // Push to Supabase in background
        const mappedList = db.products.map(toSupabaseProduct);
        (async () => {
          try {
            const { error: upsertErr } = await supabase.from("products").upsert(mappedList);
            if (upsertErr) console.error("Error seeding default products to Supabase:", upsertErr.message);
            else console.log("Successfully seeded default products to Supabase!");
          } catch (err: any) {
            console.error("Exception seeding Supabase products:", err.message || err);
          }
        })();

        return res.json({ success: true, data: db.products });
      }
    } catch (err: any) {
      console.warn("Supabase products fetch failed, using local fallback cache:", err.message || err);
    }
    const db = readDb();
    if (!db.products || db.products.length === 0) {
      db.products = PRODUCTS;
      writeDb(db);
    }
    res.json({ success: true, data: db.products });
  });

  app.post("/api/products", async (req, res) => {
    try {
      const db = readDb();
      const newProduct = req.body as Product;
      
      if (!newProduct.id) {
        newProduct.id = "prod_" + Date.now();
      }
      
      const index = db.products.findIndex(p => p.id === newProduct.id);
      if (index > -1) {
        db.products[index] = { ...db.products[index], ...newProduct };
      } else {
        db.products.push(newProduct);
      }
      writeDb(db);

      try {
        const mapped = toSupabaseProduct(newProduct);
        const { error } = await supabase.from("products").upsert(mapped);
        if (error) console.error("Supabase upsert product error:", error.message);
      } catch (sbErr: any) {
        console.error("Supabase write exception:", sbErr.message || sbErr);
      }

      res.json({ success: true, data: db.products });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.put("/api/products/:id", async (req, res) => {
    try {
      const db = readDb();
      const id = req.params.id;
      const updatedProduct = req.body as Product;
      
      const index = db.products.findIndex(p => p.id === id);
      if (index > -1) {
        db.products[index] = { ...db.products[index], ...updatedProduct };
        writeDb(db);

        try {
          const mapped = toSupabaseProduct(db.products[index]);
          const { error } = await supabase.from("products").upsert(mapped);
          if (error) console.error("Supabase update product error:", error.message);
        } catch (sbErr: any) {
          console.error("Supabase write exception:", sbErr.message || sbErr);
        }

        res.json({ success: true, data: db.products });
      } else {
        res.status(404).json({ success: false, error: "Product not found" });
      }
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    try {
      const db = readDb();
      const id = req.params.id;
      
      db.products = db.products.filter(p => p.id !== id);
      writeDb(db);

      try {
        const { error } = await supabase.from("products").delete().eq("id", id);
        if (error) console.error("Supabase delete product error:", error.message);
      } catch (sbErr: any) {
        console.error("Supabase delete exception:", sbErr.message || sbErr);
      }

      res.json({ success: true, data: db.products });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post("/api/products/bulk", async (req, res) => {
    try {
      const db = readDb();
      const updatedList = req.body as Product[];
      db.products = updatedList;
      writeDb(db);

      try {
        const mappedList = updatedList.map(toSupabaseProduct);
        const { error } = await supabase.from("products").upsert(mappedList);
        if (error) console.error("Supabase bulk products error:", error.message);
      } catch (sbErr: any) {
        console.error("Supabase bulk write exception:", sbErr.message || sbErr);
      }

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
  app.get("/api/orders", async (req, res) => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) {
        throw error;
      }
      if (data) {
        const mapped = data.map(fromSupabaseOrder);
        const db = readDb();
        db.orders = mapped;
        writeDb(db);
        return res.json({ success: true, data: mapped });
      }
    } catch (err: any) {
      console.warn("Supabase orders fetch failed, using local fallback cache:", err.message || err);
    }
    const db = readDb();
    res.json({ success: true, data: db.orders });
  });

  app.post("/api/orders", async (req, res) => {
    try {
      const db = readDb();
      const newOrder = req.body as Order;
      if (!newOrder.id) {
        newOrder.id = "order_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
      }
      
      db.orders.unshift(newOrder);
      writeDb(db);

      try {
        const mapped = toSupabaseOrder(newOrder);
        const { error } = await supabase.from("orders").insert(mapped);
        if (error) {
          console.error("Supabase save order table error:", error.message);
        } else {
          console.log("Order saved to Supabase successfully.");
        }
      } catch (sbErr: any) {
        console.error("Supabase save order exception:", sbErr.message || sbErr);
      }

      res.json({ success: true, data: newOrder });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.put("/api/orders/:id/status", async (req, res) => {
    try {
      const db = readDb();
      const id = req.params.id;
      const { status } = req.body as { status: Order["status"] };
      
      const index = db.orders.findIndex(o => o.id === id);
      if (index > -1) {
        db.orders[index].status = status;
        writeDb(db);

        try {
          const { error } = await supabase
            .from("orders")
            .update({ status })
            .eq("order_id", id);
          if (error) console.error("Supabase update order status error:", error.message);
        } catch (sbErr: any) {
          console.error("Supabase order status exception:", sbErr.message || sbErr);
        }

        res.json({ success: true, data: db.orders[index] });
      } else {
        res.status(404).json({ success: false, error: "Order not found" });
      }
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // API Routes: Inquiries / Appointments
  app.get("/api/inquiries", async (req, res) => {
    try {
      let { data, error } = await supabase
        .from("appointments")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) {
        const bResult = await supabase
          .from("bookings")
          .select("*")
          .order("created_at", { ascending: false });
        data = bResult.data;
        error = bResult.error;
      }

      if (error) {
        const iResult = await supabase
          .from("inquiries")
          .select("*")
          .order("created_at", { ascending: false });
        data = iResult.data;
        error = iResult.error;
      }

      if (error) {
        throw error;
      }

      if (data) {
        const mapped = data.map((item: any) => ({
          id: item.id?.toString(),
          name: item.name,
          phone: item.phone,
          message: item.message || "",
          created_at: item.created_at || new Date().toISOString()
        }));
        
        const db = readDb();
        db.inquiries = mapped;
        writeDb(db);
        return res.json({ success: true, data: mapped });
      }
    } catch (err: any) {
      console.warn("Supabase inquiries fetch failed, using local fallback cache:", err.message || err);
    }
    const db = readDb();
    res.json({ success: true, data: db.inquiries });
  });

  app.post("/api/inquiries", async (req, res) => {
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

      try {
        let { error } = await supabase.from("appointments").insert({
          name: created.name,
          phone: created.phone,
          message: created.message
        });

        if (error) {
          const bRes = await supabase.from("bookings").insert({
            name: created.name,
            phone: created.phone,
            message: created.message
          });
          error = bRes.error;
        }

        if (error) {
          const iRes = await supabase.from("inquiries").insert({
            name: created.name,
            phone: created.phone,
            message: created.message
          });
          error = iRes.error;
        }

        if (error) {
          console.error("Supabase inquiry insert table error:", error.message);
        } else {
          console.log("Inquiry saved to Supabase successfully.");
        }
      } catch (sbErr: any) {
        console.error("Supabase save inquiry exception:", sbErr.message || sbErr);
      }

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

  // API Routes: Layout Config setting toggle switches
  app.get("/api/layout", (req, res) => {
    const db = readDb();
    res.json({ success: true, data: db.layout });
  });

  app.post("/api/layout", (req, res) => {
    try {
      const db = readDb();
      db.layout = { ...db.layout, ...req.body } as LayoutConfig;
      writeDb(db);
      res.json({ success: true, data: db.layout });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // API Routes: Image uploader (handles base64 image strings and writes locally)
  app.post("/api/upload", (req, res) => {
    try {
      const { image, filename } = req.body as { image: string; filename?: string };
      if (!image) {
        return res.status(400).json({ success: false, error: "No image content provided" });
      }

      // If it's a data URL, strip header and save binary data
      const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        // Assume already uploaded URL or format we can't parse directly
        return res.json({ success: true, url: image });
      }

      const mimeType = matches[1];
      const base64Data = matches[2];
      const buffer = Buffer.from(base64Data, "base64");

      const extension = mimeType.split("/")[1] || "png";
      const fileId = "img_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
      const name = filename ? `${fileId}_${filename.replace(/[^a-zA-Z0-9.-]/g, "_")}` : `${fileId}.${extension}`;
      const filePath = path.join(UPLOADS_DIR, name);

      fs.writeFileSync(filePath, buffer);

      const publicUrl = `/uploads/${name}`;
      res.json({ success: true, url: publicUrl });
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
