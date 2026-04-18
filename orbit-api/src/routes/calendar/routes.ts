import { createRoute } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes"
import { jsonContent } from "stoker/openapi/helpers";
import { z } from "zod"

export const list = createRoute({
	path: "/calendar",
	method: "get",
	tags: ["calendar"],
	responses: {
		[HttpStatusCodes.OK]: jsonContent(
			z.array(
				z.object({
					name: z.string(),
					date: z.string(),
					description: z.string().optional()
				})
			),
			"List of calendar events"
		)
	}
})
export type listRoute = typeof list
