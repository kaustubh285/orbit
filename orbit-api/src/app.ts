import configureOpenAPI from "./lib/configure-openapi.js"
import createApp from "./lib/create-app.js"
import index from "./routes/index.route.js"
import calendar from "./routes/calendar/calendar.route.js"
const app = createApp()

configureOpenAPI(app)

const routes = [index, calendar]

routes.forEach((route) => {
	app.route("/", route)
})

// app.get('/', (c) => {
// 	return c.text('Hello Hono!')
// })

app.get("/err", (c) => {
	c.var.logger.info("something is wrong here!!! ")
	throw new Error("This is an error")
})


export default app
