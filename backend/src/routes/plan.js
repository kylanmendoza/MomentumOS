import { Router } from "express";
import { generatePlan, savePlan, getPlans } from "../controllers/planController.js";

const router = Router();

router.post("/generate", generatePlan);
router.post("/save", savePlan);
router.get("/", getPlans);

export default router;
