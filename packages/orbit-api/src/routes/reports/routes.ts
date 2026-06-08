import { createRoute } from "@hono/zod-openapi";
import { z } from "zod";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent } from "stoker/openapi/helpers";


const reportDataSchema = z.object({
	// Quests
	questsCompleted: z.number(),
	questsIncomplete: z.number(),
	questCompletionRate: z.number(), // 0–100
	overdueQuests: z.number(),

	// Saves
	savesAdded: z.number(),
	savesArchived: z.number(),
	aiSummariesGenerated: z.number(),
	savesByPlatform: z.object({
		youtube: z.number(),
		reddit: z.number(),
		instagram: z.number(),
		web: z.number(),
	}),

	// Tags & lists
	topTags: z.array(z.object({ tag: z.string(), count: z.number() })),
	topLists: z.array(z.object({ name: z.string(), savesAdded: z.number() })),

	// Notes
	notesCreated: z.number(),
	notesEdited: z.number(),

	// Consistency
	activeDays: z.number(),

	// Remembrals
	remembrals: z.array(z.object({
		name: z.string(),
		date: z.string().datetime({ offset: true }),
	})),
});

export type ReportData = z.infer<typeof reportDataSchema>;

export const generatedReportSchema = z.object({
	userId: z.string().uuid(),
	startDate: z.string().datetime({ offset: true }),
	endDate: z.string().datetime({ offset: true }),
	generatedAt: z.string().datetime({ offset: true }),
	data: reportDataSchema,
});

const reportRequestSchema = z.object({
	startDate: z.string().datetime({ offset: true }),
	endDate: z.string().datetime({ offset: true }),
});

export const inAppReport = createRoute({
	path: "/report/in-app",
	method: "get",
	tags: ["Reports"],
	request: { query: reportRequestSchema },
	responses: {
		[HttpStatusCodes.OK]: jsonContent(generatedReportSchema, "Report"),
	},
});

export const emailReport = createRoute({
	path: "/report/email",
	method: "get",
	tags: ["Reports"],
	request: { query: reportRequestSchema },
	responses: {
		[HttpStatusCodes.OK]: jsonContent(z.null(), "Report sent"),
	},
});

export type InAppReportRoute = typeof inAppReport;
export type EmailReportRoute = typeof emailReport;
