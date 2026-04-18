import type { RouteConfig, RouteHandler } from "@hono/zod-openapi"
import { type listRoute } from "./routes.js"
import type { AppBindings, AppRouteHandler } from "@/lib/types.js"



export const listCalendarsHandler: AppRouteHandler<listRoute> = (c) => {
	c.var.logger.info("Listing calendars")
	return c.json([
		{
			name: "New Year's Day",
			date: "2024-01-01",
			description: "The first day of the year"
		}])
}
