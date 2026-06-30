import { createRoute } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";
import { z } from "zod";

const notFoundSchema = z.object({ message: z.string() });

export const selectUserSchema = z.object({
	id: z.string().uuid(),
	name: z.string(),
	displayName: z.string().nullable(),
	email: z.string(),
	avatar: z.string().nullable(),
	aiModel: z.enum(["none", "sarvam", "haiku"]),
});

export const patchUserSchema = z.object({
	aiModel: z.enum(["none", "sarvam", "haiku"]).optional(),
	displayName: z.string().nullable().optional(),
	bio: z.string().nullable().optional(),
});

export const getMe = createRoute({
	path: "/users/me",
	method: "get",
	tags: ["Users"],
	responses: {
		[HttpStatusCodes.OK]: jsonContent(selectUserSchema, "Current user"),
		[HttpStatusCodes.NOT_FOUND]: jsonContent(notFoundSchema, "User not found"),
	},
});

export const updateMe = createRoute({
	path: "/users/me",
	method: "patch",
	tags: ["Users"],
	request: {
		body: jsonContentRequired(patchUserSchema, "User fields to update"),
	},
	responses: {
		[HttpStatusCodes.OK]: jsonContent(selectUserSchema, "Updated user"),
		[HttpStatusCodes.NOT_FOUND]: jsonContent(notFoundSchema, "User not found"),
	},
});

export type GetMeRoute = typeof getMe;
export type UpdateMeRoute = typeof updateMe;
