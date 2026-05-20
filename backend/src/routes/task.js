import { Router } from "express";
import { toggleTask } from "../controllers/taskController.js";

const router = Router();

router.patch("/:id", toggleTask);

export default router;
