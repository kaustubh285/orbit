import type { AppOpenAPI } from "./types.js";
import packageJson from "../../package.json" with { type: "json" }
import { Scalar } from "@scalar/hono-api-reference";
import env from "@/env.js";

export const openAPIConfig = {
	openapi: "3.0.0" as const,
	info: {
		title: "Orbit API",
		version: packageJson.version,
		description: "API for Orbit, the ultimate super app!"
	},
	servers: [
		{
			url: `http://localhost:${env.PORT}`,
			description: "Local development server"
		}
	]
}

function isLocalhost(c: Parameters<Parameters<AppOpenAPI["use"]>[0]>[0]): boolean {
	const host = c.req.header("host") ?? ""
	const hostname = host.split(":")[0]
	return hostname === "localhost" || hostname === "127.0.0.1"
}

export default function configureOpenAPI(app: AppOpenAPI) {
	app.use("/doc", async (c, next) => {
		if (!isLocalhost(c)) return c.json({ message: "Not found" }, 404)
		return next()
	})
	app.doc("/doc", openAPIConfig)

	app.use("/api-docs", async (c, next) => {
		if (!isLocalhost(c)) return c.json({ message: "Not found" }, 404)
		return next()
	})
	app.get('/api-docs', Scalar({
		layout: "classic",
		defaultHttpClient: {
			targetKey: "node",
			clientKey: "fetch"
		}, url: '/doc', theme: "elysiajs", persistAuth: true
	}))
}
