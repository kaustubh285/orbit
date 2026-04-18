import { OpenAPIHono } from "@hono/zod-openapi"
import { notFound, onError, serveEmojiFavicon } from "stoker/middlewares"
import { myPinoLogger } from "@/middlewares/pino-logger.middleware.js"
import type { AppBindings } from "./types.js"



export default function createApp() {
	const app = new OpenAPIHono<AppBindings>({
		strict: false
	})
	app.use(myPinoLogger())
	app.use(serveEmojiFavicon("🌐"))

	app.notFound(notFound)
	app.onError(onError)
	return app
}
