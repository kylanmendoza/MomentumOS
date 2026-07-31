import { PrismaClient } from "@prisma/client";
import { generateSchedule, normalizeSchedule } from "../services/openaiService.js";

const prisma = new PrismaClient();

export async function generatePlan(req, res, next) {
  try {
    const { goals, previousSchedule, refinementRequest } = req.body;
    if (!goals) {
      return res.status(400).json({ error: "goals are required" });
    }

    // Tell the browser "this is a stream, stay connected"
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const stream = await generateSchedule({ goals, previousSchedule, refinementRequest });

    // Iterate the stream - each chunk is a token from the AI model, send it to the client as an SSE event
    let accumulate = "";
    for await (const chunk of stream) {
      const token = chunk.choices[0]?.delta?.content || "";
      accumulate += token;
      res.write(`data: ${JSON.stringify({ token })}\n\n`);
    }

    // Parse the complete JSON and send a "done" event
    const { scheduleType, tasks } = normalizeSchedule(JSON.parse(accumulate));
    res.write(`data: ${JSON.stringify({ done: true, scheduleType, tasks })}\n\n`);
    res.end();
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
