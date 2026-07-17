import * as HttpStatusCodes from "stoker/http-status-codes";
import { createRoute, z } from "@hono/zod-openapi";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";
import { selectSaveWithListsSchema } from "../saves/routes.js";

// A ranked save carries the same shape the frontend already renders, plus the
// one-line "why this" reason from the reranker.
const rankedSaveSchema = selectSaveWithListsSchema.extend({
	reason: z.string(),
});

const aiQueryResponseSchema = z.object({
	// What the assistant understood — shown to the user so an empty result reads
	// as a near-miss ("looked for: cpu, processor…") rather than a dead end.
	interpretation: z.string(),
	results: z.array(rankedSaveSchema),
});

export const getAiQueryResult = createRoute({
	path: "/ai/query",
	method: "post",
	tags: ["AI", "search"],
	request: {
		body: jsonContentRequired(z.object({
			query: z.string().min(1),
		}), "Query body is required"),
	},
	responses: {
		[HttpStatusCodes.OK]: jsonContent(aiQueryResponseSchema, "Ranked saves with reasons"),
	},
});

export type AiQueryRoute = typeof getAiQueryResult;
