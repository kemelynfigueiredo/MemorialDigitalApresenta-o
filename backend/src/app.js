import express from "express";
import cors from "cors";
import "dotenv/config";

import { uploadDir } from "./config/upload.js";
import authRoutes from "./routes/auth.routes.js";
import memorialRoutes from "./routes/memorial.routes.js";

const app = express();
const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.set("trust proxy", 1);
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(null, false);
  },
}));
app.use(express.json());
app.use("/uploads", express.static(uploadDir));

app.get("/", (req, res) => {
  return res.json({
    mensagem: "API do Memorial Digital funcionando.",
  });
});

app.use("/api", authRoutes);
app.use("/api/memoriais", memorialRoutes);

export default app;
