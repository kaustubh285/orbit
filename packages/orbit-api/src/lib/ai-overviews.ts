import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

const client = new Anthropic();

const enrichmentSchema = z.object({
	ai_title: z.string(),
	summary: z.string(),
	tags: z.array(z.string()),
	list: z.string(),
	category: z.enum(["cooking", "tech", "travel", "fitness", "entertainment", "finance", "learning", "personal", "other"]).catch("other"),
	contentType: z.enum(["tutorial", "review", "opinion", "inspiration", "news", "reference", "entertainment", "other"]).catch("other"),
	attributes: z.object({
		difficulty: z.string().nullable(),
		timeEstimate: z.string().nullable(),
	}).nullable().default(null),
	recipe: z.object({
		ingredients: z.array(z.string()),
		steps: z.array(z.string()).nullable(),
		servings: z.string().nullable(),
	}).nullable().default(null),
	watchList: z.array(z.string()).nullable().default(null),
	keyPoints: z.array(z.string()).nullable().default(null),
	location: z.object({
		name: z.string(),
		context: z.string(),
	}).nullable().default(null),
	timeSensitive: z.boolean().default(false),
});

export type EnrichmentResult = z.infer<typeof enrichmentSchema>;

const DESC_MAX_CHARS = 600;
const TAGS_MAX = 15;
const LISTS_MAX = 20;

export async function aiOverview({ title, description, author, note, tags, lists, selectedLists }: {
	title: string,
	description: string,
	author?: string | null,
	note?: string | null,
	tags: string[],
	lists: string[],
	selectedLists?: { name: string; description: string | null }[],
}): Promise<EnrichmentResult | null> {

	const trimmedDesc = description ? description.slice(0, DESC_MAX_CHARS) : "None";
	const trimmedTags = tags.slice(0, TAGS_MAX);
	const trimmedLists = lists.slice(0, LISTS_MAX);

	const hasSelected = selectedLists && selectedLists.length > 0;
	const listContextLine = hasSelected
		? `LISTS SAVED TO: ${selectedLists!.map((l) => `"${l.name}"${l.description ? ` — ${l.description.slice(0, 60)}` : ""}`).join("; ")}`
		: `USER'S LISTS: ${trimmedLists.length ? trimmedLists.join(", ") : "none"} (pick best fit or invent a 2-3 word name)`;

	const intentLine = note ? `\nINTENT (user's note — drive summary & tags from this): ${note}` : "";
	const authorLine = author ? `\nAUTHOR: ${author}` : "";

	const listPlaceholder = hasSelected ? selectedLists![0].name : "...";

	const prompt = `Extract structured data from a saved item. JSON only, no markdown fences.

TITLE: ${title || "Unknown"}
DESC: ${trimmedDesc}${authorLine}${intentLine}
${listContextLine}
EXISTING TAGS (reuse relevant ones, add new): ${trimmedTags.length ? trimmedTags.join(", ") : "none"}

Rules:
- ai_title: clean, descriptive title (~60 chars max). Strip hashtags and raw captions.
- summary: describe what the content CONTAINS and TEACHES (e.g. "a 4-step checklist covering X, Y, Z"), NOT what the poster DID. Answer "what will I get from this?" in 2-3 sentences.
- tags: 3-7 subject-matter tags. NEVER include: platform names, "post"/"video"/"reel"/"content", the author's name, hashtag fragments.
- list: return one best-fit list name from the lists above
- category: one of cooking|tech|travel|fitness|entertainment|finance|learning|personal|other
- contentType: one of tutorial|review|opinion|inspiration|news|reference|entertainment|other
- attributes: include difficulty + timeEstimate if relevant (e.g. for tutorials/recipes), otherwise null
- recipe: only for cooking/food content with extractable ingredients, otherwise null
- watchList: only for "X movies/shows/books to watch" style content, otherwise null
- keyPoints: the actual takeaways/steps for educational content, otherwise null
- location: if a specific named place is featured, otherwise null
- timeSensitive: true only if there's a real deadline or time-bound event

{"ai_title":"...","summary":"...","tags":["..."],"list":"${listPlaceholder}","category":"other","contentType":"other","attributes":null,"recipe":null,"watchList":null,"keyPoints":null,"location":null,"timeSensitive":false}`;

	try {
		const response = await client.messages.create({
			model: "claude-haiku-4-5-20251001",
			max_tokens: 800,
			messages: [{ role: "user", content: prompt }],
		});

		const rawText = response.content
			.filter((block) => block.type === "text")
			.map((block) => block.text)
			.join("");

		console.log("[aiOverview] tokens used — input:", response.usage.input_tokens, "output:", response.usage.output_tokens);

		const text = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();

		let parsed: unknown;
		try {
			parsed = JSON.parse(text);
		} catch {
			console.error("[aiOverview] JSON parse failed — raw:", rawText);
			return null;
		}

		const result = enrichmentSchema.safeParse(parsed);
		if (!result.success) {
			console.error("[aiOverview] Zod validation failed — errors:", JSON.stringify(result.error.issues), "raw:", rawText);
			return null;
		}

		console.log("[aiOverview] parsed ok — ai_title:", result.data.ai_title, "category:", result.data.category, "tags:", result.data.tags);
		return result.data;
	} catch (err) {
		console.error("[aiOverview] failed — title:", title, "error:", err);
		return null;
	}
}
