import { createRoute } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";
import { z } from "zod";
import {
	questTypeEnum,
	questStatusEnum,
	questPriorityEnum,
} from "../../db/schemas/quests.schema.js";

const coerceDatetime = z.preprocess((val) => {
	if (typeof val === "string" && val.trim() !== "") {
		const d = new Date(val);
		if (!isNaN(d.getTime())) return d.toISOString();
	}
	return val;
}, z.string().datetime({ offset: true }).nullable());

export const selectQuestSchema = z.object({
	id: z.string().uuid(),
	userId: z.string().uuid(),
	type: z.enum(questTypeEnum.enumValues),
	status: z.enum(questStatusEnum.enumValues),
	priority: z.enum(questPriorityEnum.enumValues).nullable(),
	title: z.string(),
	body: z.string().nullable(),
	dueAt: coerceDatetime,
	completedAt: coerceDatetime,
	startAt: coerceDatetime,
	endAt: coerceDatetime,
	location: z.string().nullable(),
	lastCompletedAt: coerceDatetime,
	createdAt: z.string().datetime({ offset: true }),
	updatedAt: z.string().datetime({ offset: true }),
});

export const insertQuestSchema = z.object({
	type: z.enum(questTypeEnum.enumValues),
	status: z.enum(questStatusEnum.enumValues).optional(),
	priority: z.enum(questPriorityEnum.enumValues).nullable().optional(),
	title: z.string().min(1).max(500),
	body: z.string().nullable().optional(),
	dueAt: coerceDatetime.optional(),
	completedAt: coerceDatetime.optional(),
	startAt: coerceDatetime.optional(),
	endAt: coerceDatetime.optional(),
	location: z.string().nullable().optional(),
	lastCompletedAt: coerceDatetime.optional(),
	listId: z.string().uuid().nullable().optional(),
});

export const patchQuestSchema = insertQuestSchema.partial();

const idParamsSchema = z.object({ id: z.string().uuid() });
const notFoundSchema = z.object({ message: z.string() });
const validationErrorSchema = z.object({ error: z.object({}).passthrough() });

const listQuerySchema = z.object({
	type: z.enum(questTypeEnum.enumValues).optional(),
	status: z.enum(questStatusEnum.enumValues).optional(),
	priority: z.enum(questPriorityEnum.enumValues).optional(),
	date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().openapi({ description: "Filter by date in YYYY-MM-DD format" }),
});

export const list = createRoute({
	path: "/quests",
	method: "get",
	tags: ["Quests"],
	request: { query: listQuerySchema },
	responses: {
		[HttpStatusCodes.OK]: jsonContent(z.array(selectQuestSchema), "List of quests"),
	},
});

export const create = createRoute({
	path: "/quests",
	method: "post",
	tags: ["Quests"],
	request: {
		body: jsonContentRequired(insertQuestSchema, "Quest to create"),
	},
	responses: {
		[HttpStatusCodes.CREATED]: jsonContent(selectQuestSchema, "Created quest"),
		[HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(validationErrorSchema, "Validation error"),
	},
});

export const getOne = createRoute({
	path: "/quests/{id}",
	method: "get",
	tags: ["Quests"],
	request: { params: idParamsSchema },
	responses: {
		[HttpStatusCodes.OK]: jsonContent(selectQuestSchema, "A quest"),
		[HttpStatusCodes.NOT_FOUND]: jsonContent(notFoundSchema, "Quest not found"),
	},
});

export const update = createRoute({
	path: "/quests/{id}",
	method: "patch",
	tags: ["Quests"],
	request: {
		params: idParamsSchema,
		body: jsonContentRequired(patchQuestSchema, "Quest fields to update"),
	},
	responses: {
		[HttpStatusCodes.OK]: jsonContent(selectQuestSchema, "Updated quest"),
		[HttpStatusCodes.NOT_FOUND]: jsonContent(notFoundSchema, "Quest not found"),
		[HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(validationErrorSchema, "Validation error"),
	},
});

export const remove = createRoute({
	path: "/quests/{id}",
	method: "delete",
	tags: ["Quests"],
	request: { params: idParamsSchema },
	responses: {
		[HttpStatusCodes.NO_CONTENT]: { description: "Quest archived" },
		[HttpStatusCodes.NOT_FOUND]: jsonContent(notFoundSchema, "Quest not found"),
	},
});

export type ListRoute = typeof list;
export type CreateRoute = typeof create;
export type GetOneRoute = typeof getOne;
export type UpdateRoute = typeof update;
export type RemoveRoute = typeof remove;
