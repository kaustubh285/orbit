import type { AppOpenAPI } from "./types.js";
import packageJson from "../../package.json" with { type: "json" }
import { Scalar } from "@scalar/hono-api-reference";
import env from "@/env.js";

export default function configureOpenAPI(app: AppOpenAPI) {
	app.doc("/doc", {
		openapi: "3.0.0",
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
	})


	app.get('/api-docs', Scalar({
		layout: "classic",
		defaultHttpClient: {
			targetKey: "node",
			clientKey: "fetch"
		}, url: '/doc', theme: "elysiajs", persistAuth: true
	}))
}
