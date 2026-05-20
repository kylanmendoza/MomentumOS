import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateSchedule({ goals, hours }) {
  const prompt = `You are an expert productivity planner.

Create a structured daily schedule based on:
- Goals: ${goals}
- Available time: ${hours} hours

Rules:
- Break the day into time blocks
- Include short breaks every 90 minutes
- Make tasks actionable and specific
- Keep it realistic for one day
- Output ONLY valid JSON — no markdown, no explanation:

[
  { "time": "HH:MM-HH:MM", "task": "..." }
]`;

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
    response_format: { type: "json_object" },
  });

  const raw = response.choices[0].message.content;

  // GPT sometimes wraps the array in an object key — handle both shapes
  const parsed = JSON.parse(raw);
  const schedule = Array.isArray(parsed)
    ? parsed
    : parsed.schedule || parsed.tasks || Object.values(parsed)[0];

  if (!Array.isArray(schedule)) {
    throw new Error("Unexpected AI response shape");
  }

  return schedule;
}
