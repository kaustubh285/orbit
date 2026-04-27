import { OpenAPIHono } from "@hono/zod-openapi"
import { cors } from "hono/cors"
import env from "@/env.js"
import { notFound, onError, serveEmojiFavicon } from "stoker/middlewares"
import { myPinoLogger } from "@/middlewares/pino-logger.middleware.js"
import type { AppBindings } from "./types.js"
import { defaultHook } from "stoker/openapi"

export function createAppRouter() {
	return new OpenAPIHono<AppBindings>({
		strict: false,
		defaultHook
	})
}

export default function createApp() {
	const app = createAppRouter()
	app.use(cors({ origin: env.FRONTEND_URL, maxAge: 86400 }))
	app.use(myPinoLogger())
	app.use(serveEmojiFavicon("🌐"))

	app.notFound(notFound)
	app.onError(onError)
	return app
}
