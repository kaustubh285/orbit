import { createAppRouter } from "@/lib/create-app.js"

const ALLOWED_HOSTS = [".cdninstagram.com", ".fbcdn.net"]

function isAllowedHost(url: string): boolean {
	try {
		const { hostname } = new URL(url)
		return ALLOWED_HOSTS.some((suffix) => hostname.endsWith(suffix))
	} catch {
		return false
	}
}

const router = createAppRouter()

router.get("/proxy/image", async (c) => {
	const url = c.req.query("url")
	if (!url) return c.text("Missing url", 400)
	if (!isAllowedHost(url)) return c.text("Forbidden", 403)

	let upstream: Response
	try {
		upstream = await fetch(url, {
			headers: {
				"User-Agent": "Mozilla/5.0 (compatible; OrbitBot/1.0)",
				Accept: "image/*,*/*",
			},
		})
	} catch {
		return c.text("Upstream fetch failed", 502)
	}

	if (!upstream.ok) return c.text("Upstream error", upstream.status as 502)

	const contentType = upstream.headers.get("content-type") ?? "image/jpeg"

	return new Response(upstream.body, {
		status: 200,
		headers: {
			"Content-Type": contentType,
			"Cache-Control": "public, max-age=86400, immutable",
		},
	})
})

export default router
