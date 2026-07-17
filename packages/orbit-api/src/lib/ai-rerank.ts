import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

const anthropicClient = new Anthropic();

// Stage C — "rerank". Dumb SQL (Stage B) fetches a wide net of keyword
// candidates; this call applies judgment the keyword match can't: which of
// these actually answer the query, and why. Returns an interpretation of what
// was understood (shown to the user so a miss reads as a near-miss) plus the
// top ids with a one-line reason each.

export type RerankCandidate = {
	id: string;
	title: string;
	summary: string;
	note: string | null;
	tags: string[];
	lists: string[];
};

const rerankSchema = z.object({
	interpretation: z.string(),
	results: z
		.array(
			z.object({
				saveId: z.string(),
				reason: z.string(),
			}),
		)
		.max(8),
});

export type RerankOutput = z.infer<typeof rerankSchema>;

const RERANK_SYSTEM = `You are the relevance judge for a personal saves library search. Output valid JSON only, no markdown fences.

You receive the user's original query and a numbered list of candidate saves (already keyword-matched, so some will be off-topic false positives). Pick the ones that genuinely answer the query.

Rules:
- interpretation: one short sentence describing what the user is looking for, in your own words ("Looking for short Mexican recipes to cook tonight").
- results: the 5-8 best-matching saves, best first. Use ONLY the exact saveId values given. Drop candidates that merely share a word but don't fit the intent — returning fewer good results beats padding with weak ones.
- reason: one concise clause (<= 12 words) on why this save fits ("30-min CPU explainer, matches 'how computers work'"). No trailing period needed.
- If nothing genuinely fits, return an empty results array.

Output: {"interpretation":"...","results":[{"saveId":"...","reason":"..."}]}`;

function compactCandidate(c: RerankCandidate, index: number): string {
	const parts = [
		`[${index}] id=${c.id}`,
		`title: ${c.title}`,
		c.summary ? `summary: ${c.summary.slice(0, 200)}` : "",
		c.note ? `note: ${c.note.slice(0, 120)}` : "",
		c.tags.length ? `tags: ${c.tags.slice(0, 8).join(", ")}` : "",
		c.lists.length ? `lists: ${c.lists.join(", ")}` : "",
	].filter(Boolean);
	return parts.join(" | ");
}

export async function aiRerank(query: string, candidates: RerankCandidate[]): Promise<RerankOutput | null> {
	if (!candidates.length) return null;

	const userContent = `Query: ${query}\n\nCandidates:\n${candidates.map(compactCandidate).join("\n")}`;

	try {
		const response = await anthropicClient.messages.create({
			model: "claude-haiku-4-5-20251001",
			max_tokens: 600,
			system: [{ type: "text", text: RERANK_SYSTEM, cache_control: { type: "ephemeral" } }],
			messages: [{ role: "user", content: userContent }],
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
			console.error("[aiRerank] JSON parse failed — raw:", rawText);
			return null;
		}

		const result = rerankSchema.safeParse(parsed);
		if (!result.success) {
			console.error("[aiRerank] Zod validation failed:", JSON.stringify(result.error.issues));
			return null;
		}

		// Keep only ids the model was actually given — guard against hallucinated ids.
		const validIds = new Set(candidates.map((c) => c.id));
		result.data.results = result.data.results.filter((r) => validIds.has(r.saveId));

		console.log("[aiRerank] picked:", result.data.results.length, "of", candidates.length);
		return result.data;
	} catch (err) {
		console.error("[aiRerank] failed — error:", err);
		return null;
	}
}
