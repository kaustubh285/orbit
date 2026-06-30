import configureOpenAPI from "./lib/configure-openapi.js"
import createApp from "./lib/create-app.js"
import index from "./routes/index.route.js"
import quests from "./routes/quests/quests.route.js"
import saves from "./routes/saves/saves.route.js"
import lists from "./routes/lists/lists.route.js"
import reports from "./routes/reports/reports.route.js"
import users from "./routes/users/users.route.js"
import env from "./env.js"

const app = createApp()
configureOpenAPI(app)

const routes = [index, quests, saves, lists, reports, users]
routes.forEach((route) => {
	app.route("/", route)
})

if (env.NODE_ENV !== "production") {
	app.get("/err", (c) => {
		c.var.logger.info("test error endpoint triggered")
		throw new Error("This is a test error")
	})
}

export type AppType = typeof app
export { app }
export default app
