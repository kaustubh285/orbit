import z from "zod";
import { sarvamClient } from "./sarvam-ai.js";
import { db } from "@/db/db.js";
import { questsTable } from "@/db/schemas/quests.schema.js";
import { eq } from "drizzle-orm";

type Props = {
	title: string;
	body: string | null;
	id: string;
	timezone: string;
};

const aiParsedQuestSchema = z.object({
	title: z.string(),
	body: z.string(),
	dueAt: z.string().optional(),
	location: z.string().optional(),
	priority: z.union([
		z.literal("urgent"),
		z.literal("important"),
		z.literal("quick_win"),
		z.literal("deep_work"),
		z.literal("someday"),
		z.literal("waiting"),
	]),
})

type AiParsedQuest = z.infer<typeof aiParsedQuestSchema>;

export const parseQuest = async (data: Props) => {
	const { title, body, id, timezone } = data;

	let now: string;
	try {
		now = new Date().toLocaleString("en-US", { timeZone: timezone, hour12: false, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", timeZoneName: "short" });
	} catch {
		now = new Date().toISOString();
	}
	const prompt = `Extract structured data from a todo item. Output valid JSON only — no markdown, no explanation.

CURRENT TIME: ${now} (${timezone})

TITLE: ${title || ""}
DESC: ${body || ""}

Output a JSON object with these fields:
- title (string): the task title with the date/time expression removed — but ONLY the part that was used to populate dueAt. Do not reword, shorten, or change anything else. If no date/time was extracted (dueAt is omitted), return the title exactly as given. Example: "Water plants tomorrow at 10am" → "Water plants". If a date/time appears in the title but is part of the topic rather than a scheduling cue (e.g. "Book tickets for New Year's Eve"), keep it.
- body (string): if a description is provided, use it as-is. If empty or missing, write one short sentence describing what the task is and why someone would do it, inferred only from the title.
- dueAt (string, optional): ISO 8601 datetime in UTC (e.g. "2025-06-01T09:00:00Z"). Interpret times as being in the user's timezone (${timezone}), then convert to UTC. Resolve relative expressions like "tomorrow 9am" or "next Monday" using CURRENT TIME above. Omit if no date is mentioned.
- location (string, optional): physical place explicitly mentioned (e.g. "Hyde Park", "New York", "the office"). Omit if none.
- priority (string): one of exactly these values:
    "urgent"     — must happen today or has a hard deadline soon
    "important"  — high-value but not time-critical
    "quick_win"  — takes under 15 minutes, easy to knock out
    "deep_work"  — requires focused, uninterrupted effort
    "waiting"    — blocked on someone else or an external event
    "someday"    — low priority, no deadline, nice-to-have

STRICT RULES:
- Only use information explicitly present in the title/description. Do not infer or invent.
- If a field is optional and not clearly present, omit it entirely.`;


	const response = await sarvamClient.chat.completions({
		model: "sarvam-105b",
		temperature: 0.1,
		messages: [
			{ role: "system", content: "You are a structured data extractor. Output valid JSON only, no markdown fences. Never invent details not explicitly present in the source content." },
			{ role: "user", content: prompt },
		],
	});
	let rawText = response?.choices[0]?.message?.content ?? "";
	console.log("[parseQuest] model=sarvam tokens — input:", response?.usage?.prompt_tokens, "output:", response?.usage?.completion_tokens, "total:", response?.usage?.total_tokens);
	console.log("[parseQuest] finish_reason:", response?.choices[0]?.finish_reason);
	if (!rawText) {
		console.error("[parseQuest] empty response — full response:", JSON.stringify(response));
		return null;
	}


	const text = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
	let parsed: unknown;
	try {
		parsed = JSON.parse(text);
	} catch {
		console.error("[parseQuest] JSON parse failed — raw:", rawText);
		return null;
	}

	const result = aiParsedQuestSchema.safeParse(parsed);
	if (!result.success) {
		console.error("[parseQuest] Zod validation failed — errors:", JSON.stringify(result.error.issues), "raw:", rawText);
		return null;
	}

	const { dueAt, ...rest } = result.data;
	await db.update(questsTable).set({
		...rest,
		...(dueAt ? { dueAt: new Date(dueAt) } : {}),
	}).where(eq(questsTable.id, id))

	// return result.data;
}
