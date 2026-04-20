import { createAppRouter } from "@/lib/create-app.js";
import { createRoute } from "@hono/zod-openapi";
import { jsonContent } from "stoker/openapi/helpers";
import { z } from "zod"
import * as HttpStatusCodes from "stoker/http-status-codes"

const router = createAppRouter().openapi(
	createRoute({
		tags: ["index"],
		method: "get",
		path: "/",
		responses: {
			[HttpStatusCodes.OK]: jsonContent(z.object({
				message: z.string()
			}), "Successful response"
			)
			// 404: {
			// 	description: "Not Found"
			// },
			// 500: {
			// 	description: "Internal Server Error"
			// }
		}
	}), (c) => {
		return c.json({
			message: "Orbit first api"
		})
	}
)

export default router
