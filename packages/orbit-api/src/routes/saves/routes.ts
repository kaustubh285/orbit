import { createRoute } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";
import { z } from "zod";

export const backfillResultSchema = z.object({
	queued: z.number(),
	message: z.string(),
});
import { savePlatformEnum, saveStatusEnum } from "../../db/schemas/saves.schema.js";

export const selectSaveSchema = z.object({
	id: z.string().uuid(),
	userId: z.string().uuid(),
	sourceUrl: z.string().url(),
	sourcePlatform: z.enum(savePlatformEnum.enumValues),
	title: z.string().nullable(),
	description: z.string().nullable(),
	thumbnailUrl: z.string().nullable(),
	author: z.string().nullable(),
	publishedAt: z.string().datetime({ offset: true }).nullable(),
	note: z.string().nullable(),
	tags: z.array(z.string()),
	status: z.enum(saveStatusEnum.enumValues),
	aiTitle: z.string().nullable(),
	aiSummary: z.string().nullable(),
	aiEnrichedAt: z.string().datetime({ offset: true }).nullable(),
	createdAt: z.string().datetime({ offset: true }),
	updatedAt: z.string().datetime({ offset: true }),
});

export const insertSaveSchema = z.object({
	sourceUrl: z.string().url(),
	sourcePlatform: z.enum(savePlatformEnum.enumValues).optional(),
	title: z.string().nullable().optional(),
	description: z.string().nullable().optional(),
	thumbnailUrl: z.string().nullable().optional(),
	author: z.string().nullable().optional(),
	publishedAt: z.string().datetime({ offset: true }).nullable().optional(),
	note: z.string().nullable().optional(),
	status: z.enum(saveStatusEnum.enumValues).optional(),
	listIds: z.array(z.string().uuid()).optional(),
	tags: z.array(z.string()).nullable().optional(),
	aiSummary: z.string().nullable().optional(),
	shouldAISummaries: z.boolean().optional().default(true),
});

export const updateListSchema = z.object({
	id: z.string().uuid(),
	listIds: z.array(z.string().uuid()).optional(),
});

export const patchSaveSchema = insertSaveSchema.partial();

const idParamsSchema = z.object({ id: z.string().uuid() });
const notFoundSchema = z.object({ message: z.string() });
const validationErrorSchema = z.object({ error: z.object({}).passthrough() });

const listQuerySchema = z.object({
	platform: z.enum(savePlatformEnum.enumValues).optional(),
	status: z.enum(saveStatusEnum.enumValues).optional(),
	tag: z.string().optional(),
	limit: z.coerce.number().int().min(1).max(200).default(50).openapi({ description: "Max results to return" }),
	cursor: z.string().datetime({ offset: true }).optional().openapi({ description: "Return saves created before this ISO datetime (for pagination)" }),
	q: z.string().min(1).max(200).optional().openapi({ description: "Search across title, description, notes, tags" }),
});

export const selectSaveWithListsSchema = selectSaveSchema.extend({
	lists: z.array(z.string()),
});

export const backfill = createRoute({
	path: "/saves/backfill",
	method: "post",
	tags: ["Saves"],
	responses: {
		[HttpStatusCodes.OK]: jsonContent(backfillResultSchema, "Backfill result"),
	},
});

export const list = createRoute({
	path: "/saves",
	method: "get",
	tags: ["Saves"],
	request: { query: listQuerySchema },
	responses: {
		[HttpStatusCodes.OK]: jsonContent(z.array(selectSaveWithListsSchema), "List of saves"),
	},
});

export const duplicateSaveSchema = z.object({
	duplicate: z.literal(true),
	previouslySavedAt: z.string().datetime({ offset: true }),
	save: selectSaveSchema,
});

export const create = createRoute({
	path: "/saves",
	method: "post",
	tags: ["Saves"],
	request: {
		body: jsonContentRequired(insertSaveSchema, "Save to create"),
	},
	responses: {
		[HttpStatusCodes.CREATED]: jsonContent(selectSaveSchema, "Created save"),
		[HttpStatusCodes.OK]: jsonContent(duplicateSaveSchema, "Duplicate — save already exists"),
		[HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(validationErrorSchema, "Validation error"),
	},
});

export const getOne = createRoute({
	path: "/saves/{id}",
	method: "get",
	tags: ["Saves"],
	request: { params: idParamsSchema },
	responses: {
		[HttpStatusCodes.OK]: jsonContent(selectSaveSchema, "A save"),
		[HttpStatusCodes.NOT_FOUND]: jsonContent(notFoundSchema, "Save not found"),
	},
});

export const update = createRoute({
	path: "/saves/{id}",
	method: "patch",
	tags: ["Saves"],
	request: {
		params: idParamsSchema,
		body: jsonContentRequired(patchSaveSchema, "Save fields to update"),
	},
	responses: {
		[HttpStatusCodes.OK]: jsonContent(selectSaveSchema, "Updated save"),
		[HttpStatusCodes.NOT_FOUND]: jsonContent(notFoundSchema, "Save not found"),
		[HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(validationErrorSchema, "Validation error"),
	},
});

export const remove = createRoute({
	path: "/saves/{id}",
	method: "delete",
	tags: ["Saves"],
	request: { params: idParamsSchema },
	responses: {
		[HttpStatusCodes.NO_CONTENT]: { description: "Save archived" },
		[HttpStatusCodes.NOT_FOUND]: jsonContent(notFoundSchema, "Save not found"),
	},
});

export const updateSaveList = createRoute({
	path: "/save/list/",
	method: "post",
	tags: ["Saves", "ListsItem"],
	request: { params: idParamsSchema, body: jsonContentRequired(updateListSchema, "List IDs to update") },
	responses: {
		[HttpStatusCodes.NO_CONTENT]: { description: "Save updated" },
		[HttpStatusCodes.NOT_FOUND]: jsonContent(notFoundSchema, "Save not found"),
	},
});


export const resurfaceSaves = createRoute({
	path: "/saves/resurface",
	method: "post",
	tags: ["Saves"],
	responses: {
		[HttpStatusCodes.OK]: jsonContent(selectSaveSchema, "Resurface result"),
		[HttpStatusCodes.NO_CONTENT]: { description: "No saves to resurface" },
	},
});

export type BackfillRoute = typeof backfill;
export type ListRoute = typeof list;
export type CreateRoute = typeof create;
export type GetOneRoute = typeof getOne;
export type UpdateRoute = typeof update;
export type RemoveRoute = typeof remove;
export type UpdateSaveListRoute = typeof updateSaveList;
export type ResurfaceSavesRoute = typeof resurfaceSaves;
