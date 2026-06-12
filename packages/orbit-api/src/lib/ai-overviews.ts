import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

const client = new Anthropic();


const enrichmentSchema = z.object({
	summary: z.string(),
	tags: z.array(z.string()),
	list: z.string(),
	location: z
		.object({
			name: z.string(),
			context: z.string(),
		})
		.nullable(),
	timeSensitive: z.boolean(),
});

export type EnrichmentResult = z.infer<typeof enrichmentSchema>;

export async function aiOverview({ title, description, note, tags, lists, selectedLists }: {
	title: string,
	description: string,
	note?: string | null,
	tags: string[],
	lists: string[],
	selectedLists?: { name: string; description: string | null }[],
}): Promise<EnrichmentResult | null> {

	const hasSelected = selectedLists && selectedLists.length > 0;
	const listContextLine = hasSelected
		? `LISTS SAVED TO: ${selectedLists!.map((l) => `"${l.name}"${l.description ? ` — ${l.description.slice(0, 60)}` : ""}`).join("; ")}`
		: `USER'S LISTS: ${lists.length ? lists.join(", ") : "none"} (pick best fit or invent a 2-3 word name)`;

	const intentLine = note ? `\nINTENT (user's note — must drive summary & tags): ${note}` : "";

	const listPlaceholder = hasSelected ? selectedLists![0].name : "...";

	const prompt = `Tag and summarise a saved item. JSON only, no markdown fences.

TITLE: ${title || "Unknown"}
DESC: ${description || "None"}${intentLine}
${listContextLine}
TAGS (reuse where relevant, add new if needed): ${tags.length ? tags.join(", ") : "none"}

Rules:
- If INTENT exists: summary must lead with the user's goal/action from it; tags must capture that intent (e.g. action, timing, purpose)
- Otherwise: summarise why the user likely saved this (2-3 sentences)
- timeSensitive: true only if there's a real deadline or time-bound event
- list: return one best-fit list name from the lists above

{"summary":"...","tags":["..."],"list":"${listPlaceholder}","location":{"name":"...","context":"..."},"timeSensitive":false}`;


	try {
		const response = await client.messages.create({
			model: "claude-haiku-4-5-20251001",
			max_tokens: 500,
			messages: [{ role: "user", content: prompt }],
		});

		const rawText = response.content
			.filter((block) => block.type === "text")
			.map((block) => block.text)
			.join("");

		console.log("[aiOverview] tokens used — input:", response.usage.input_tokens, "output:", response.usage.output_tokens);

		// strip markdown fences if the model wraps the JSON
		const text = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();

		const parsed = JSON.parse(text);
		const result = enrichmentSchema.parse(parsed);
		console.log("[aiOverview] parsed ok — tags:", result.tags, "summary length:", result.summary.length);
		return result;
	} catch (err) {
		console.error("[aiOverview] failed — title:", title, "error:", err);
		return null;
	}
}
