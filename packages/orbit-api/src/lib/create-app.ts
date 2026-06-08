import { OpenAPIHono } from "@hono/zod-openapi"
import { cors } from "hono/cors"
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
	app.use(cors({
		origin: (origin) => {
			if (!origin) return null
			try {
				const host = new URL(origin).hostname
				if (host === "localhost" || host === "127.0.0.1") return origin
				if (host === "deshpande.page" || host.endsWith(".deshpande.page")) return origin
			} catch { return null }
			return null
		},
		maxAge: 86400,
	}))
	app.use(myPinoLogger())
	app.use(serveEmojiFavicon("🌐"))

	app.notFound(notFound)
	app.onError(onError)
	return app
}
