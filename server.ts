import express from "express";
import { createServer as createViteServer } from "vite";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: "dlwuxgvse",
  api_key: "589557557863559",
  api_secret: "-qknr_5WoXpjEBGCLaN74UrgufQ",
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Cloudinary Signature Endpoint
  app.post("/api/sign-cloudinary", (req, res) => {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const params = {
      timestamp: timestamp,
      // upload_preset: "ml_default", // Optional: if you have an unsigned preset, but for signed we don't strictly need it if we sign everything.
      // However, usually signed uploads don't need a preset if we sign the parameters.
      // Let's just sign the timestamp and any other params we want to enforce.
      // For simplicity, we'll just sign the timestamp.
    };

    const signature = cloudinary.utils.api_sign_request(params, cloudinary.config().api_secret!);

    res.json({
      signature,
      timestamp,
      cloudName: cloudinary.config().cloud_name,
      apiKey: cloudinary.config().api_key,
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    const path = await import("path");
    const distPath = path.resolve(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.resolve(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
