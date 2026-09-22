import { and, eq, getTableColumns, ilike, inArray, isNull, or, sql } from "drizzle-orm";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { db } from "../../db/db.js";
import { savesTable } from "../../db/schemas/saves.schema.js";
import { listItemsTable, listsTable } from "../../db/schemas/lists.schema.js";
import type { AppRouteHandler } from "@/lib/types.js";
import { aiQuery } from "@/lib/ai-query.js";
import { aiRerank, type RerankCandidate } from "@/lib/ai-rerank.js";
import type { AiQueryRoute } from "./routes.js";

const CANDIDATE_CAP = 100;
const RESULT_CAP = 8;

// aiSummary is a JSON blob ({ summary, category, contentType, ... }). Pull just
// the human summary for the reranker; fall back to the raw string.
function extractSummary(aiSummary: string | null): string {
	if (!aiSummary) return "";
	try {
		const parsed = JSON.parse(aiSummary);
		return typeof parsed?.summary === "string" ? parsed.summary : aiSummary;
	} catch {
		return aiSummary;
	}
}

// Stage B — retrieve. Wide keyword net over the topical text fields. Platforms
// are applied as a hard WHERE when present (the user said "YouTube" — honour it).
// No recency ordering: old saves matching the query must compete fairly with new
// ones; the reranker handles ranking.
async function retrieveCandidates(userId: string, keywords: string[], platforms: string[] | null) {
	const keywordConds = keywords.map((kw) => {
		const like = `%${kw}%`;
		return or(
			ilike(savesTable.title, like),
			ilike(savesTable.aiTitle, like),
			ilike(savesTable.description, like),
			ilike(savesTable.aiSummary, like),
			ilike(savesTable.note, like),
			ilike(savesTable.sourceUrl, like),
			sql`array_to_string(${savesTable.tags}, ' ') ILIKE ${like}`,
		);
	});

	const conditions = [
		eq(savesTable.userId, userId),
		isNull(savesTable.deletedAt),
		eq(savesTable.status, "active"),
		or(...keywordConds),
	];

	if (platforms && platforms.length > 0) {
		conditions.push(inArray(savesTable.sourcePlatform, platforms as typeof savesTable.sourcePlatform.dataType[]));
	}

	return db
		.select({
			...getTableColumns(savesTable),
			lists: sql<string[]>`ARRAY_REMOVE(ARRAY_AGG(${listsTable.name}), NULL)`,
		})
		.from(savesTable)
		.leftJoin(listItemsTable, and(eq(listItemsTable.saveId, savesTable.id), isNull(listItemsTable.deletedAt)))
		.leftJoin(listsTable, eq(listsTable.id, listItemsTable.listId))
		.where(and(...conditions))
		.groupBy(savesTable.id)
		.limit(CANDIDATE_CAP);
}

export const getAiQueryResult: AppRouteHandler<AiQueryRoute> = async (c) => {
	const userId = c.var.userId;
	const { query } = c.req.valid("json");

	// Stage A — understand (always returns a usable plan)
	const plan = await aiQuery(query);

	// Stage B — retrieve
	const candidates = await retrieveCandidates(userId, plan.keywords, plan.platforms);

	if (!candidates.length) {
		return c.json(
			{ interpretation: `Looked for: ${plan.keywords.join(", ")}`, results: [] },
			HttpStatusCodes.OK,
		);
	}

	// Stage C — rerank
	const rerankInput: RerankCandidate[] = candidates.map((s) => ({
		id: s.id,
		title: s.aiTitle ?? s.title ?? s.sourceUrl,
		summary: extractSummary(s.aiSummary),
		note: s.note,
		tags: s.tags,
		lists: s.lists,
	}));

	const reranked = await aiRerank(query, rerankInput);

	if (reranked && reranked.results.length) {
		const byId = new Map(candidates.map((s) => [s.id, s]));
		const results = reranked.results
			.map((r) => {
				const save = byId.get(r.saveId);
				return save ? { ...save, reason: r.reason } : null;
			})
			.filter((s): s is NonNullable<typeof s> => s !== null)
			.slice(0, RESULT_CAP);

		return c.json({ interpretation: reranked.interpretation, results }, HttpStatusCodes.OK);
	}

	// Rerank failed or found nothing worth ranking — fall back to raw candidates
	// so the user still gets keyword hits rather than an empty page.
	const fallbackResults = candidates.slice(0, RESULT_CAP).map((s) => ({ ...s, reason: "" }));
	return c.json(
		{ interpretation: `Looked for: ${plan.keywords.join(", ")}`, results: fallbackResults },
		HttpStatusCodes.OK,
	);
};
