import { db } from "@/db/db.js";
import { listItemsTable, listsTable } from "@/db/schemas/lists.schema.js";
import { savesTable } from "@/db/schemas/saves.schema.js";
import { and, eq, getTableColumns, gte, isNull, lte, or, sql } from "drizzle-orm";

export const resurfaceLogic = async ({ userId }: { userId: string }) => {
	const tag = `[resurface] userId=${userId}`;

	let allLists = await db
		.select()
		.from(listsTable)
		.where(and(eq(listsTable.userId, userId), isNull(listsTable.deletedAt)));

	console.log(`${tag} lists_total=${allLists.length} lists_with_resurface=${allLists.filter(l => l.includeInResurface).length}`);

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

	const resurfacedListIds = [...new Set(resurfacedSaves.map(s => s.listId).filter(Boolean))];
	console.log(`${tag} resurfaced_today=${resurfacedSaves.length} lists_already_done=${JSON.stringify(resurfacedListIds)}`);

	allLists = allLists.filter(list => list.includeInResurface && !resurfacedSaves.some(save => save.listId === list.id));
	console.log(`${tag} eligible_lists=${allLists.length} ids=${JSON.stringify(allLists.map(l => ({ id: l.id, name: l.name })))}`);

	if (allLists.length === 0) {
		console.log(`${tag} result=null reason=no_eligible_lists`);
		return null;
	}

	let remainingLists = [...allLists];
	let selectedListSaves: Awaited<ReturnType<typeof queryListSaves>> | undefined;
	let selectedList: typeof allLists[number] | undefined;

	while (remainingLists.length > 0) {
		const randomList = pickRandom(remainingLists);
		const saves = await queryListSaves(randomList.id, oneMonthAgo);

		console.log(`${tag} trying list="${randomList.name}" id=${randomList.id} eligible_saves=${saves.length}`);

		if (saves.length > 0) {
			selectedListSaves = saves;
			selectedList = randomList;
			break;
		}
		remainingLists = remainingLists.filter(l => l.id !== randomList.id);
	}

	if (!selectedListSaves || !selectedList) {
		console.log(`${tag} result=null reason=no_eligible_saves_in_any_list`);
		return null;
	}

	const randomSave = pickRandom(selectedListSaves);
	console.log(`${tag} selected list="${selectedList.name}" save="${randomSave.saves.title ?? randomSave.saves.id}"`);

	const [updated] = await db
		.update(savesTable)
		.set({
			lastSurfacedAt: new Date(),
			resurfaceCount: sql`${savesTable.resurfaceCount} + 1`,
		})
		.where(eq(savesTable.id, randomSave.saves.id))
		.returning();

	console.log(`${tag} result=ok saveId=${updated.id}`);
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
