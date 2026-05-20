import "dotenv/config";
import express from "express";
import cors from "cors";
import planRoutes from "./routes/plan.js";
import taskRoutes from "./routes/task.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api/plan", planRoutes);
app.use("/api/task", taskRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`MomentumOS API running on http://localhost:${PORT}`);
});
