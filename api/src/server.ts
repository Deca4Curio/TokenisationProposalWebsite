import express from "express";
import { validateApiSecret } from "./middleware.js";
import authRoutes from "./routes/auth.js";
import proposalRoutes from "./routes/proposals.js";
import quoteRoutes from "./routes/quotes.js";

const app = express();
const port = parseInt(process.env.PORT || "8080");

app.use(express.json());

// Health check (no auth required)
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// All other routes require API secret
app.use(validateApiSecret);
app.use("/auth", authRoutes);
app.use("/proposals", proposalRoutes);
app.use("/quotes", quoteRoutes);

app.listen(port, () => {
  console.log(`Tokenise API listening on port ${port}`);
});
