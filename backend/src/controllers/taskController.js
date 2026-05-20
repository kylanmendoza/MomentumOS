import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function toggleTask(req, res, next) {
  try {
    const { id } = req.params;
    const { completed } = req.body;

    if (typeof completed !== "boolean") {
      return res.status(400).json({ error: "completed must be a boolean" });
    }

    const task = await prisma.task.update({
      where: { id },
      data: { completed },
    });

    res.json(task);
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Task not found" });
    }
    next(err);
  }
}
