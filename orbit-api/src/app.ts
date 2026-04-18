import createApp from "./lib/create-app.js"

const app = createApp()

app.get('/', (c) => {
	return c.text('Hello Hono!')
})

app.get("/err", (c) => {
	c.var.logger.info("something is wrong here!!! ")
	throw new Error("This is an error")
})


export default app
