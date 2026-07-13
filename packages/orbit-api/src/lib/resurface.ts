import { db } from "@/db/db.js";
import { listItemsTable, listsTable } from "@/db/schemas/lists.schema.js";
import { savesTable } from "@/db/schemas/saves.schema.js";
import { and, eq, getTableColumns, gte, isNull, lte, or, sql } from "drizzle-orm";

export const resurfaceLogic = async ({ userId }: { userId: string }) => {

	// get lists from user which have includeInResurface true
	// get all resurfaced saves today
	// omit listIds from these resurfaced saves
	// from remaining lists, pick a random list, and pick a save that matches condition (e.g. not resurfaced today, resurface date is more than 1 month or null, resurface count is less than max of resurfaceCount for that user, lastInteractionAt is more than 1 month or null)

	let allLists = await db
		.select()
		.from(listsTable)
		.where(and(eq(listsTable.userId, userId), isNull(listsTable.deletedAt)));

	const oneMonthAgo = new Date();
	oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

	const startOfToday = new Date();
	startOfToday.setHours(0, 0, 0, 0);

	const resurfacedSaves = await db
		.select({
			...getTableColumns(savesTable),
			listId: listItemsTable.listId,
		})
		.from(savesTable)
		.leftJoin(listItemsTable, and(eq(listItemsTable.saveId, savesTable.id), isNull(listItemsTable.deletedAt)))
		.where(and(eq(savesTable.userId, userId), isNull(savesTable.deletedAt), gte(savesTable.lastSurfacedAt, startOfToday)));

	allLists = allLists.filter(list => list.includeInResurface && !resurfacedSaves.some(save => save.listId === list.id));

	if (allLists.length === 0) return null;

	let remainingLists = [...allLists];
	let selectedListSaves: Awaited<ReturnType<typeof queryListSaves>> | undefined;

	while (remainingLists.length > 0) {
		const randomList = pickRandom(remainingLists);
		const saves = await queryListSaves(randomList.id, oneMonthAgo);

		if (saves.length > 0) {
			selectedListSaves = saves;
			break;
		}
		remainingLists = remainingLists.filter(l => l.id !== randomList.id);
	}

	if (!selectedListSaves) return null;
	const randomSave = pickRandom(selectedListSaves);

	const [updated] = await db
		.update(savesTable)
		.set({
			lastSurfacedAt: new Date(),
			resurfaceCount: sql`${savesTable.resurfaceCount} + 1`,
		})
		.where(eq(savesTable.id, randomSave.saves.id))
		.returning();

	return updated;

};



const queryListSaves = (listId: string, oneMonthAgo: Date) =>
	db.select()
		.from(listItemsTable)
		.innerJoin(savesTable, eq(savesTable.id, listItemsTable.saveId))
		.where(and(
			eq(listItemsTable.listId, listId),
			isNull(listItemsTable.deletedAt),
			isNull(savesTable.deletedAt),
			or(isNull(savesTable.lastSurfacedAt), lte(savesTable.lastSurfacedAt, oneMonthAgo)),
			or(isNull(savesTable.lastInteractedAt), lte(savesTable.lastInteractedAt, oneMonthAgo)),
		));

const pickRandom = (items: any[]) => {
	return items[Math.floor(Math.random() * items.length)];
}
