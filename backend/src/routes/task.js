import { Router } from "express";
import { updateTask } from "../controllers/taskController.js";

const router = Router();

router.patch("/:id", updateTask);

export default router;
