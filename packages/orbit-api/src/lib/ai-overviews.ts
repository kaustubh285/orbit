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

export async function aiOverview({ title, description, tags, lists }: { title: string, description: string, tags: string[], lists: string[] }): Promise<EnrichmentResult | null> {

	const prompt = `You are a content tagger and summariser. Given a saved item, produce a JSON response.

		ITEM:
		- Title: ${title || "Unknown"}
		- Description: ${description || "No description"}

		USER'S EXISTING TAGS (reuse these where applicable, create new ones only when nothing fits):
		${tags.length ? tags.join(", ") : "None yet"}

		USER'S LISTS (for context about their interests, do not use as tags):
		${lists.length ? lists.join(", ") : "None yet"}

		Respond with ONLY valid JSON, no markdown fences, no explanation:
		{
		  "summary": "2-3 sentence summary of what this content is about",
		  "tags": ["tag1", "tag2", "tag3"],
		  "list": "most relevant list name from the user's lists, or empty string",
		  "location": { "name": "Place name", "context": "why mentioned" } or null,
		  "timeSensitive": false
		}`;


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
