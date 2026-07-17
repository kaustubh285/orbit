import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

const anthropicClient = new Anthropic();

// Stage A — "understand". Turn a natural-language query (or a canned chip
// phrase) into a topical search plan the SQL layer can actually act on.
//
// Only two fields, because only two are backed by real data today:
//   - keywords  → drive the ILIKE match over title/aiTitle/aiSummary/note/tags
//   - platforms → the one structured column (sourcePlatform) worth filtering on
//
// category / contentType / duration are deliberately absent: they live inside
// the aiSummary JSON blob, not queryable columns, so a structured filter on
// them can't match anything. When those get promoted to columns, add them here.
const searchPlanSchema = z.object({
	keywords: z.array(z.string()).min(1).max(8),
	platforms: z.array(z.enum(["youtube", "reddit", "instagram", "web"])).nullable().catch(null),
});

export type SearchPlan = z.infer<typeof searchPlanSchema>;

const QUERY_SYSTEM = `You expand a search query for a personal saves library (videos, articles, recipes, posts the user saved). Output valid JSON only, no markdown fences.

The library is searched by keyword match over each save's title, AI summary, note, and tags. Your job is to bridge the gap between how the user phrases the request and how the saved content is actually worded.

Rules:
- keywords: 3-8 single words. Expand the query's topic with synonyms and closely-related terms so keyword search has vocabulary coverage. Prefer concrete nouns over adjectives. Do NOT invent narrow specifics the user didn't imply.
- For vague mood queries with no topic ("bored", "something to watch"), fall back to broad form words ("funny", "short", "entertaining", "watch"). This is a weak signal — keep it small.
- platforms: only set when the query explicitly names a platform (youtube/reddit/instagram/web); otherwise null.

Examples:
"mexican recipe" -> {"keywords":["mexican","recipe","taco","salsa","cook","food"],"platforms":null}
"that video about how CPUs work" -> {"keywords":["cpu","processor","chip","computer","architecture","explainer"],"platforms":["youtube"]}
"what did I save about tokyo" -> {"keywords":["tokyo","japan","travel","city"],"platforms":null}
"bored" -> {"keywords":["funny","short","entertaining","clip","watch"],"platforms":null}

Output: {"keywords":["..."],"platforms":null}`;

const STOPWORDS = new Set([
	"the", "and", "for", "with", "that", "this", "what", "did", "was", "are", "you",
	"your", "about", "some", "something", "want", "need", "find", "show", "give",
	"from", "into", "have", "has", "get", "got", "can", "how", "who", "why", "when",
]);

// Fallback keyword extraction when the model call or parse fails — so search
// still runs on the literal query terms instead of collapsing to zero results.
function deriveKeywords(query: string): string[] {
	const words = query
		.toLowerCase()
		.replace(/[^a-z0-9\s]/g, " ")
		.split(/\s+/)
		.filter((w) => w.length > 2 && !STOPWORDS.has(w));
	const deduped = [...new Set(words)].slice(0, 8);
	return deduped.length ? deduped : [query.trim().toLowerCase()].filter(Boolean);
}

export async function aiQuery(query: string): Promise<SearchPlan> {
	const fallback: SearchPlan = { keywords: deriveKeywords(query), platforms: null };

	try {
		const response = await anthropicClient.messages.create({
			model: "claude-haiku-4-5-20251001",
			max_tokens: 200,
			system: [{ type: "text", text: QUERY_SYSTEM, cache_control: { type: "ephemeral" } }],
			messages: [{ role: "user", content: query }],
		});

		const rawText = response.content
			.filter((b) => b.type === "text")
			.map((b) => b.text)
			.join("");

		const text = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();

		let parsed: unknown;
		try {
			parsed = JSON.parse(text);
		} catch {
			console.error("[aiQuery] JSON parse failed — raw:", rawText);
			return fallback;
		}

		const result = searchPlanSchema.safeParse(parsed);
		if (!result.success) {
			console.error("[aiQuery] Zod validation failed:", JSON.stringify(result.error.issues));
			return fallback;
		}

		// Guard against an empty-keyword plan slipping through.
		if (!result.data.keywords.length) return fallback;

		console.log("[aiQuery] plan:", JSON.stringify(result.data));
		return result.data;
	} catch (err) {
		console.error("[aiQuery] failed — query:", query, "error:", err);
		return fallback;
	}
}
