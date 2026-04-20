import configureOpenAPI from "./lib/configure-openapi.js"
import createApp from "./lib/create-app.js"
import index from "./routes/index.route.js"
import quests from "./routes/quests/quests.route.js"

const app = createApp()
configureOpenAPI(app)

const routes = [index, quests]
routes.forEach((route) => {
	app.route("/", route)
})

app.get("/err", (c) => {
	c.var.logger.info("something is wrong here!!! ")
	throw new Error("This is an error")
})

export type AppType = typeof app
export { app }
export default app
