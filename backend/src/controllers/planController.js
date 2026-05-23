import { PrismaClient } from "@prisma/client";
import { generateSchedule } from "../services/openaiService.js";

const prisma = new PrismaClient();

export async function generatePlan(req, res, next) {
  try {
    const { goals } = req.body;
    if (!goals) {
      return res.status(400).json({ error: "goals are required" });
    }

    const { scheduleType, tasks } = await generateSchedule({ goals });
    res.json({ scheduleType, schedule: tasks });
  } catch (err) {
    next(err);
  }
}

export async function savePlan(req, res, next) {
  try {
    const { title, goals, schedule_type = "daily", tasks } = req.body;
    if (!title || !goals || !tasks?.length) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const plan = await prisma.plan.create({
      data: {
        title,
        goals,
        available_time: 0,
        schedule_type,
        tasks: {
          create: tasks.map((t) => ({
            time_block: t.time,
            task:       t.task,
            category:   t.category || "deep_work",
            priority:   t.priority || "medium",
          })),
        },
      },
      include: { tasks: true },
    });

    res.status(201).json(plan);
  } catch (err) {
    next(err);
  }
}

export async function getPlans(req, res, next) {
  try {
    const plans = await prisma.plan.findMany({
      orderBy: { created_at: "desc" },
      include: { tasks: true },
    });
    res.json(plans);
  } catch (err) {
    next(err);
  }
}
