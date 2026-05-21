import { PrismaClient } from "@prisma/client";
import { generateSchedule } from "../services/openaiService.js";

const prisma = new PrismaClient();

export async function generatePlan(req, res, next) {
  try {
    const { goals, hours, scheduleType = "daily" } = req.body;
    if (!goals || !hours) {
      return res.status(400).json({ error: "goals and hours are required" });
    }

    const schedule = await generateSchedule({ goals, hours, scheduleType });
    res.json({ schedule });
  } catch (err) {
    next(err);
  } 
}

export async function savePlan(req, res, next) {
  try {
    const { title, goals, available_time, schedule_type = "daily", tasks } = req.body;
    if (!title || !goals || !available_time || !tasks?.length) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const plan = await prisma.plan.create({
      data: {
        title,
        goals,
        available_time: Number(available_time),
        schedule_type,
        tasks: {
          create: tasks.map((t) => ({
            time_block: t.time,
            task: t.task,
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
