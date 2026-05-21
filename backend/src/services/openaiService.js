import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const PROMPT_CONFIG = {
  daily: {
    unit: "time blocks within a single day",
    timeFormat: `"H:MM AM - H:MM PM"`,
    example: `{ "time": "9:00 AM - 9:45 AM", "task": "..." }`,
    rules: [
      "Break the day into focused time blocks",
      "Use standard 12-hour AM/PM time format",
      "Include a short break every 90 minutes",
      "Make tasks actionable and specific",
      "Keep it realistic for one day",
    ],
  },
  weekly: {
    unit: "days of the week",
    timeFormat: `"Day of week (e.g. Monday, Tuesday)"`,
    example: `{ "time": "Monday", "task": "..." }`,
    rules: [
      "Assign goals to specific days of the week",
      "Distribute workload evenly — avoid overloading one day",
      "Include at least one rest or review day",
      "Group related tasks on the same day when possible",
      "Keep each day's task description concise and actionable",
    ],
  },
  monthly: {
    unit: "weeks of the month",
    timeFormat: `"Week N (e.g. Week 1, Week 2)"`,
    example: `{ "time": "Week 1", "task": "..." }`,
    rules: [
      "Divide goals across 4 weeks",
      "Week 1 should focus on setup and planning",
      "Week 4 should include review and wrap-up",
      "Make each week's objective measurable",
      "Space out milestones realistically",
    ],
  },
  yearly: {
    unit: "months of the year",
    timeFormat: `"Month name (e.g. January, February)"`,
    example: `{ "time": "January", "task": "..." }`,
    rules: [
      "Assign major goals or milestones to specific months",
      "Group related objectives in the same quarter",
      "Include review months (March, June, September, December)",
      "Keep each month's focus broad but meaningful",
      "Ensure the year builds progressively toward the main goals",
    ],
  },
};

export async function generateSchedule({ goals, hours, scheduleType = "daily" }) {
  const config = PROMPT_CONFIG[scheduleType] || PROMPT_CONFIG.daily;

  const prompt = `You are an expert productivity planner.

Create a structured ${scheduleType} schedule organized by ${config.unit}, based on:
- Goals: ${goals}
- Available time: ${hours} hours${scheduleType === "daily" ? " per day" : " total"}

Rules:
${config.rules.map((r) => `- ${r}`).join("\n")}
- Output ONLY valid JSON — no markdown, no explanation:

[
  ${config.example}
]`;

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { 
        role: "system", 
        content: `You are an elite productivity coach and scheduling expert.
        Your schedules are:
        - Realistic, never over-packed
        - Structured around human energy patterns (peak focus → admin → wind-down)
        - Specific and actionable - never vague
        - Always include cognitive breaks
        You output ONLY valid JSON. Never explain yourself.`
      },
      {
        role: "user",
        content: `Creat a ${scheduleType} schedule for: ${goals}...`
      }
    ]
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
