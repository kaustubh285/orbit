import { db } from "@/db/db.js";
import { aiCallsTable } from "@/db/schemas/ai-calls.schema.js";

type LogAiCallParams = {
	userId?: string | null;
	model: string;
	feature: string;
	inputTokens?: number | null;
	outputTokens?: number | null;
	latencyMs?: number | null;
	success?: boolean;
	errorCode?: string | null;
};

export const logAiCall = (params: LogAiCallParams): void => {
	db.insert(aiCallsTable)
		.values({
			userId: params.userId ?? null,
			model: params.model,
			feature: params.feature,
			inputTokens: params.inputTokens ?? null,
			outputTokens: params.outputTokens ?? null,
			latencyMs: params.latencyMs ?? null,
			success: params.success ?? true,
			errorCode: params.errorCode ?? null,
		})
		.catch((err) => {
			console.error("[logAiCall] failed to persist:", err);
		});
};
