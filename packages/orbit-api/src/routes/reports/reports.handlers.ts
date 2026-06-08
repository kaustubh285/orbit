import { randomUUID } from "crypto";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { and, eq, gte, isNotNull, lt, lte } from "drizzle-orm";
import { db } from "../../db/db.js";
import { questsTable } from "@/db/schemas/quests.schema.js";
import { savesTable } from "@/db/schemas/saves.schema.js";
import { listItemsTable, listsTable } from "@/db/schemas/lists.schema.js";
import type { AppRouteHandler } from "@/lib/types.js";
import type { InAppReportRoute, ReportData } from "./routes.js";


// ---------------------------------------------------------------------------
// Core computation
// ---------------------------------------------------------------------------
async function computeReport(userId: string, startDate: string, endDate: string): Promise<ReportData> {
	const start = new Date(startDate)
	const end = new Date(endDate)
	const now = new Date()

	// Fetch everything in parallel
	const [quests, saves, listItemsInPeriod, overdueQuestsRaw] = await Promise.all([
		// All quests/notes created in the period
		db.select()
			.from(questsTable)
			.where(and(
				eq(questsTable.userId, userId),
				gte(questsTable.createdAt, start),
				lte(questsTable.createdAt, end),
			)),

		// All saves created in the period
		db.select()
			.from(savesTable)
			.where(and(
				eq(savesTable.userId, userId),
				gte(savesTable.createdAt, start),
				lte(savesTable.createdAt, end),
			)),

		// List items added in the period (to compute topLists)
		db.select({ saveId: listItemsTable.saveId, listName: listsTable.name })
			.from(listItemsTable)
			.innerJoin(listsTable, eq(listsTable.id, listItemsTable.listId))
			.where(and(
				eq(listsTable.userId, userId),
				isNotNull(listItemsTable.saveId),
				gte(listItemsTable.createdAt, start),
				lte(listItemsTable.createdAt, end),
			)),

		// Currently overdue tasks (snapshot, not period-scoped)
		db.select({ id: questsTable.id })
			.from(questsTable)
			.where(and(
				eq(questsTable.userId, userId),
				eq(questsTable.status, "active"),
				isNotNull(questsTable.dueAt),
				lt(questsTable.dueAt, now),
			)),
	])

	// --- Quests (exclude notes) ---
	const tasks = quests.filter(q => q.type !== "note")
	const questsCompleted = tasks.filter(q => q.completedAt !== null).length
	const questsIncomplete = tasks.filter(q => q.completedAt === null).length
	const questCompletionRate = tasks.length > 0
		? Math.round((questsCompleted / tasks.length) * 100)
		: 0
	const overdueQuests = overdueQuestsRaw.length

	// --- Notes ---
	const notes = quests.filter(q => q.type === "note")
	const notesCreated = notes.length
	const notesEdited = notes.filter(q =>
		q.updatedAt.getTime() - q.createdAt.getTime() > 60_000
	).length

	// --- Remembrals due in the period ---
	const remembrals = quests
		.filter(q => q.isRemembral && q.dueAt !== null && q.dueAt >= start && q.dueAt <= end)
		.map(q => ({ name: q.title, date: q.dueAt!.toISOString() }))

	// --- Saves ---
	const savesAdded = saves.length
	const savesArchived = saves.filter(s => s.status === "archived").length
	const aiSummariesGenerated = saves.filter(s => s.aiEnrichedAt !== null).length
	const savesByPlatform = {
		youtube: saves.filter(s => s.sourcePlatform === "youtube").length,
		reddit: saves.filter(s => s.sourcePlatform === "reddit").length,
		instagram: saves.filter(s => s.sourcePlatform === "instagram").length,
		web: saves.filter(s => s.sourcePlatform === "web").length,
	}

	// --- Top tags (from saves in period, top 5 by frequency) ---
	const tagCounts = new Map<string, number>()
	for (const save of saves) {
		for (const tag of save.tags) {
			tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1)
		}
	}
	const topTags = [...tagCounts.entries()]
		.sort((a, b) => b[1] - a[1])
		.slice(0, 5)
		.map(([tag, count]) => ({ tag, count }))

	// --- Top lists (by saves added in period, top 3) ---
	const listCounts = new Map<string, number>()
	for (const item of listItemsInPeriod) {
		if (item.listName) {
			listCounts.set(item.listName, (listCounts.get(item.listName) ?? 0) + 1)
		}
	}
	const topLists = [...listCounts.entries()]
		.sort((a, b) => b[1] - a[1])
		.slice(0, 3)
		.map(([name, savesAdded]) => ({ name, savesAdded }))

	// --- Active days (unique calendar days with any activity) ---
	const activeDateSet = new Set<string>()
	const toDay = (d: Date) => d.toISOString().slice(0, 10)
	for (const q of quests) activeDateSet.add(toDay(q.createdAt))
	for (const s of saves) activeDateSet.add(toDay(s.createdAt))
	const activeDays = activeDateSet.size

	return {
		questsCompleted,
		questsIncomplete,
		questCompletionRate,
		overdueQuests,
		savesAdded,
		savesArchived,
		aiSummariesGenerated,
		savesByPlatform,
		topTags,
		topLists,
		notesCreated,
		notesEdited,
		activeDays,
		remembrals,
	}
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------
export const generateReport: AppRouteHandler<InAppReportRoute> = async (c) => {
	const userId = c.var.userId
	const { startDate, endDate } = c.req.valid("query")



	const data = await computeReport(userId, startDate, endDate)

	return c.json({
		userId,
		startDate,
		endDate,
		generatedAt: new Date().toISOString(),
		data,
	}, HttpStatusCodes.OK)
}
