import { createRoute } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";
import { z } from "zod";
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
	status: z.enum(saveStatusEnum.enumValues),
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
});

export const patchSaveSchema = insertSaveSchema.partial();

const idParamsSchema = z.object({ id: z.string().uuid() });
const notFoundSchema = z.object({ message: z.string() });
const validationErrorSchema = z.object({ error: z.object({}).passthrough() });

const listQuerySchema = z.object({
	platform: z.enum(savePlatformEnum.enumValues).optional(),
	status: z.enum(saveStatusEnum.enumValues).optional(),
});

export const list = createRoute({
	path: "/saves",
	method: "get",
	tags: ["Saves"],
	request: { query: listQuerySchema },
	responses: {
		[HttpStatusCodes.OK]: jsonContent(z.array(selectSaveSchema), "List of saves"),
	},
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

export type ListRoute = typeof list;
export type CreateRoute = typeof create;
export type GetOneRoute = typeof getOne;
export type UpdateRoute = typeof update;
export type RemoveRoute = typeof remove;
