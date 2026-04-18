import { createAppRouter } from "@/lib/create-app.js";
import * as handlers from "./calendar.handlers.js"
import * as routes from "./routes.js"


const router = createAppRouter().openapi(
	routes.list,
	handlers.listCalendarsHandler
)

export default router
