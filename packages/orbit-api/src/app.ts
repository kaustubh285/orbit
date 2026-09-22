import configureOpenAPI from "./lib/configure-openapi.js"
import createApp from "./lib/create-app.js"
import index from "./routes/index.route.js"
import quests from "./routes/quests/quests.route.js"
import saves from "./routes/saves/saves.route.js"
import lists from "./routes/lists/lists.route.js"
import reports from "./routes/reports/reports.route.js"
import users from "./routes/users/users.route.js"
import ai from "./routes/ai/ai.route.js"
import queue from "./routes/queue/queue.route.js"
import env from "./env.js"

const PROXY_ALLOWED_HOSTS = [".cdninstagram.com", ".fbcdn.net"]
function isProxyAllowed(url: string): boolean {
	try {
		const { hostname } = new URL(url)
		return PROXY_ALLOWED_HOSTS.some((s) => hostname.endsWith(s))
	} catch { return false }
}

const app = createApp()
configureOpenAPI(app)

// Must be registered before sub-routers whose use("*") wildcard middleware
// would otherwise intercept this unauthenticated endpoint.
app.get("/proxy/image", async (c) => {
	const url = c.req.query("url")
	if (!url) return c.text("Missing url", 400)
	if (!isProxyAllowed(url)) return c.text("Forbidden", 403)
	let upstream: Response
	try {
		upstream = await fetch(url, {
			headers: { "User-Agent": "Mozilla/5.0 (compatible; OrbitBot/1.0)", Accept: "image/*,*/*" },
		})
	} catch { return c.text("Upstream fetch failed", 502) }
	if (!upstream.ok) return c.text("Upstream error", upstream.status as 502)
	const contentType = upstream.headers.get("content-type") ?? "image/jpeg"
	return new Response(upstream.body, {
		status: 200,
		headers: { "Content-Type": contentType, "Cache-Control": "public, max-age=86400, immutable" },
	})
})

const routes = [index, quests, saves, lists, reports, users, ai, queue]
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
