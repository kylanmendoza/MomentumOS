import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const VALID_CATEGORIES = ["deep_work", "creative", "review", "break", "personal", "admin"];
const VALID_PRIORITIES  = ["high", "medium", "low"];

export async function updateTask(req, res, next) {
  try {
    const { id } = req.params;
    const { completed, time_block, task, category, priority } = req.body;

    const data = {};
    if (typeof completed === "boolean") data.completed = completed;
    if (time_block  !== undefined) data.time_block = time_block;
    if (task        !== undefined) data.task = task;
    if (category    !== undefined && VALID_CATEGORIES.includes(category)) data.category = category;
    if (priority    !== undefined && VALID_PRIORITIES.includes(priority))  data.priority = priority;

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: "No valid fields provided" });
    }

    const updated = await prisma.task.update({ where: { id }, data });
    res.json(updated);
  } catch (err) {
    if (err.code === "P2025") return res.status(404).json({ error: "Task not found" });
    next(err);
  }
}
