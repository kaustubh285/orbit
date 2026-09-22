import { createRoute } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";
import { z } from "zod";
import { selectSaveSchema } from "../saves/routes.js";

export const selectQueueItemSchema = z.object({
	id: z.string().uuid(),
	createdAt: z.string().datetime({ offset: true }),
	save: selectSaveSchema,
});

const idParamsSchema = z.object({ id: z.string().uuid() });
const notFoundSchema = z.object({ message: z.string() });

export const list = createRoute({
	path: "/queue",
	method: "get",
	tags: ["Queue"],
	responses: {
		[HttpStatusCodes.OK]: jsonContent(z.array(selectQueueItemSchema), "User's queue"),
	},
});

export const create = createRoute({
	path: "/queue",
	method: "post",
	tags: ["Queue"],
	request: {
		body: jsonContentRequired(z.object({ saveId: z.string().uuid() }), "Save to add"),
	},
	responses: {
		[HttpStatusCodes.CREATED]: jsonContent(selectQueueItemSchema, "Queue item created"),
		[HttpStatusCodes.NOT_FOUND]: jsonContent(notFoundSchema, "Save not found"),
		[HttpStatusCodes.CONFLICT]: jsonContent(notFoundSchema, "Already in queue"),
	},
});

export const remove = createRoute({
	path: "/queue/:id",
	method: "delete",
	tags: ["Queue"],
	request: { params: idParamsSchema },
	responses: {
		[HttpStatusCodes.NO_CONTENT]: { description: "Removed from queue" },
		[HttpStatusCodes.NOT_FOUND]: jsonContent(notFoundSchema, "Queue item not found"),
	},
});

export type ListRoute = typeof list;
export type CreateRoute = typeof create;
export type RemoveRoute = typeof remove;
