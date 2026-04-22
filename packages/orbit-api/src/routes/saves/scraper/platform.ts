import type { Platform } from "./types.js"

export function detectPlatform(url: string): Platform {
	try {
		const { hostname } = new URL(url)
		if (hostname.includes("youtube.com") || hostname.includes("youtu.be")) return "youtube"
		if (hostname.includes("reddit.com")) return "reddit"
		if (hostname.includes("instagram.com")) return "instagram"
	} catch {}
	return "web"
}
