import { createRoute } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";
import { z } from "zod";
import { selectQuestSchema } from "../quests/routes.js";
import { selectSaveSchema } from "../saves/routes.js";

export const selectListSchema = z.object({
	id: z.string().uuid(),
	userId: z.string().uuid(),
	name: z.string(),
	description: z.string().nullable(),
	color: z.string().nullable(),
	createdAt: z.string().datetime({ offset: true }),
	updatedAt: z.string().datetime({ offset: true }),
});

export const selectListItemSchema = z.object({
	id: z.string().uuid(),
	listId: z.string().uuid(),
	questId: z.string().uuid().nullable(),
	saveId: z.string().uuid().nullable(),
	createdAt: z.string().datetime({ offset: true }),
	quest: selectQuestSchema.nullable(),
	save: selectSaveSchema.nullable(),
});

export const selectListWithItemsSchema = selectListSchema.extend({
	items: z.array(selectListItemSchema),
});

export const insertListSchema = z.object({
	name: z.string().min(1).max(255),
	description: z.string().nullable().optional(),
	color: z.string().nullable().optional(),
});

export const patchListSchema = insertListSchema.partial();

export const addListItemSchema = z
	.object({
		questId: z.string().uuid().optional(),
		saveId: z.string().uuid().optional(),
	})
	.refine((d) => !!(d.questId ?? d.saveId), {
		message: "Either questId or saveId is required",
	})
	.refine((d) => !(d.questId && d.saveId), {
		message: "Only one of questId or saveId may be set",
	});

const idParamsSchema = z.object({ id: z.string().uuid() });
const itemIdParamsSchema = z.object({
	id: z.string().uuid(),
	itemId: z.string().uuid(),
});
const notFoundSchema = z.object({ message: z.string() });
const validationErrorSchema = z.object({ error: z.object({}).passthrough() });

export const list = createRoute({
	path: "/lists",
	method: "get",
	tags: ["Lists"],
	responses: {
		[HttpStatusCodes.OK]: jsonContent(z.array(selectListSchema), "List of lists"),
	},
});

export const create = createRoute({
	path: "/lists",
	method: "post",
	tags: ["Lists"],
	request: {
		body: jsonContentRequired(insertListSchema, "List to create"),
	},
	responses: {
		[HttpStatusCodes.CREATED]: jsonContent(selectListSchema, "Created list"),
		[HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(validationErrorSchema, "Validation error"),
	},
});

export const getOne = createRoute({
	path: "/lists/{id}",
	method: "get",
	tags: ["Lists"],
	request: { params: idParamsSchema },
	responses: {
		[HttpStatusCodes.OK]: jsonContent(selectListWithItemsSchema, "A list with its items"),
		[HttpStatusCodes.NOT_FOUND]: jsonContent(notFoundSchema, "List not found"),
	},
});

export const update = createRoute({
	path: "/lists/{id}",
	method: "patch",
	tags: ["Lists"],
	request: {
		params: idParamsSchema,
		body: jsonContentRequired(patchListSchema, "List fields to update"),
	},
	responses: {
		[HttpStatusCodes.OK]: jsonContent(selectListSchema, "Updated list"),
		[HttpStatusCodes.NOT_FOUND]: jsonContent(notFoundSchema, "List not found"),
		[HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(validationErrorSchema, "Validation error"),
	},
});

export const remove = createRoute({
	path: "/lists/{id}",
	method: "delete",
	tags: ["Lists"],
	request: { params: idParamsSchema },
	responses: {
		[HttpStatusCodes.NO_CONTENT]: { description: "List deleted" },
		[HttpStatusCodes.NOT_FOUND]: jsonContent(notFoundSchema, "List not found"),
	},
});

export const addItem = createRoute({
	path: "/lists/{id}/items",
	method: "post",
	tags: ["Lists"],
	request: {
		params: idParamsSchema,
		body: jsonContentRequired(addListItemSchema, "Item to add"),
	},
	responses: {
		[HttpStatusCodes.CREATED]: jsonContent(selectListItemSchema, "Added list item"),
		[HttpStatusCodes.NOT_FOUND]: jsonContent(notFoundSchema, "List not found"),
		[HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(validationErrorSchema, "Validation error"),
	},
});

export const removeItem = createRoute({
	path: "/lists/{id}/items/{itemId}",
	method: "delete",
	tags: ["Lists"],
	request: { params: itemIdParamsSchema },
	responses: {
		[HttpStatusCodes.NO_CONTENT]: { description: "Item removed from list" },
		[HttpStatusCodes.NOT_FOUND]: jsonContent(notFoundSchema, "List item not found"),
	},
});

export type ListRoute = typeof list;
export type CreateRoute = typeof create;
export type GetOneRoute = typeof getOne;
export type UpdateRoute = typeof update;
export type RemoveRoute = typeof remove;
export type AddItemRoute = typeof addItem;
export type RemoveItemRoute = typeof removeItem;
