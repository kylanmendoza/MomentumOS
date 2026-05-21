import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `You are an elite productivity coach and scheduling expert.
Your schedules are:
- Realistic and never over-packed
- Structured around human energy patterns (peak focus in the morning, admin mid-day, wind-down later)
- Specific and actionable — never vague
- Always inclusive of cognitive breaks
- Sensitive to the user's stated priorities and constraints

Each task in your output must include:
- "time": the time block or period label
- "task": a specific, actionable description
- "category": one of "deep_work" | "admin" | "creative" | "break" | "review" | "personal"
- "priority": one of "high" | "medium" | "low"

You output ONLY valid JSON arrays. Never explain yourself or add markdown.`;

const PROMPT_CONFIG = {
  daily: {
    unit: "time blocks within a single day",
    example: `{ "time": "9:00 AM - 9:45 AM", "task": "...", "category": "deep_work", "priority": "high" }`,
    rules: [
      "Break the day into focused time blocks using 12-hour AM/PM format",
      "Schedule high-priority and cognitively demanding tasks in the morning",
      "Include a short break (if it is specified) to requested break time",
      "Avoid scheduling deep work after 4 PM",
      "Make tasks actionable and specific — no vague entries",
      "Keep it realistic for one day",
    ],
  },
  weekly: {
    unit: "days of the week",
    example: `{ "time": "Monday", "task": "...", "category": "deep_work", "priority": "high" }`,
    rules: [
      "Assign goals to specific days of the week",
      "Front-load high-priority work early in the week (Monday–Wednesday)",
      "Reserve Friday for review, wrap-up, and planning ahead",
      "Include at least one lighter or recovery day",
      "Group related tasks on the same day when possible",
    ],
  },
  monthly: {
    unit: "weeks of the month",
    example: `{ "time": "Week 1", "task": "...", "category": "deep_work", "priority": "high" }`,
    rules: [
      "Divide goals across 4 weeks",
      "Week 1: setup, research, and planning",
      "Week 2–3: execution and deep work",
      "Week 4: review, polish, and wrap-up",
      "Make each week's objective measurable",
    ],
  },
  yearly: {
    unit: "months of the year",
    example: `{ "time": "January", "task": "...", "category": "deep_work", "priority": "high" }`,
    rules: [
      "Assign major goals or milestones to specific months",
      "Group related objectives within the same quarter",
      "Schedule review months at end of each quarter",
      "Ensure the year builds progressively toward the main goals",
      "Balance ambition with realistic pacing",
    ],
  },
};

export async function generateSchedule({ goals, hours, scheduleType = "daily" }) {
  const config = PROMPT_CONFIG[scheduleType] || PROMPT_CONFIG.daily;

  const now = new Date();
  const dayName = now.toLocaleDateString("en-US", { weekday: "long" });
  const currentTime = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const dateStr = now.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  const userPrompt = `Today is ${dayName}, ${dateStr}. Current time: ${currentTime}.

Create a structured ${scheduleType} schedule organized by ${config.unit}, based on:
- Goals: ${goals}
- Available time: ${hours} hours${scheduleType === "daily" ? " — schedule from the current time onward" : " total"}

Rules:
${config.rules.map((r) => `- ${r}`).join("\n")}

Output a JSON array. Each object must match this shape exactly:
${config.example}`;

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.65,
    response_format: { type: "json_object" },
  });

  const raw = response.choices[0].message.content;

  const parsed = JSON.parse(raw);
  const schedule = Array.isArray(parsed)
    ? parsed
    : parsed.schedule || parsed.tasks || Object.values(parsed)[0];

  if (!Array.isArray(schedule)) {
    throw new Error("Unexpected AI response shape");
  }

  return schedule;
}
