import type { ScrapedMeta } from "./types.js"

type Parsed = Pick<ScrapedMeta, "title" | "description" | "thumbnailUrl" | "author">

function extractMeta(html: string, prop: string): string | null {
	const propPattern = prop.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
	return (
		html.match(new RegExp(`<meta[^>]+property="${propPattern}"[^>]+content="([^"]+)"`, "i"))?.[1] ??
		html.match(new RegExp(`<meta[^>]+content="([^"]+)"[^>]+property="${propPattern}"`, "i"))?.[1] ??
		null
	)
}

export function parseOpenGraph(html: string): Parsed {
	const title =
		extractMeta(html, "og:title") ??
		html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() ??
		null

	return {
		title,
		description: extractMeta(html, "og:description"),
		thumbnailUrl: extractMeta(html, "og:image"),
		author: extractMeta(html, "og:site_name"),
	}
}
