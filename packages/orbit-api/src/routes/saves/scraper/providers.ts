import { parseOpenGraph } from "./og-parser.js"
import { fetchHtml, fetchJson } from "./safe-fetch.js"
import {
	MAX_AUTHOR_LEN,
	MAX_DESCRIPTION_LEN,
	MAX_TITLE_LEN,
	sanitizeHttpUrl,
	sanitizeText,
} from "./sanitize.js"
import type { ScrapedMeta } from "./types.js"

type ProviderResult = Partial<Omit<ScrapedMeta, "sourcePlatform">>

interface OEmbedResponse {
	title?: string
	author_name?: string
	thumbnail_url?: string
}

function sanitize(raw: ProviderResult): ProviderResult {
	return {
		title: sanitizeText(raw.title, MAX_TITLE_LEN),
		description: sanitizeText(raw.description, MAX_DESCRIPTION_LEN),
		author: sanitizeText(raw.author, MAX_AUTHOR_LEN),
		thumbnailUrl: sanitizeHttpUrl(raw.thumbnailUrl),
		publishedAt: raw.publishedAt ?? null,
	}
}

export async function scrapeYouTube(url: string): Promise<ProviderResult> {
	const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`
	const data = await fetchJson<OEmbedResponse>(oembedUrl)
	if (!data) return {}
	return sanitize({
		title: data.title ?? null,
		author: data.author_name ?? null,
		thumbnailUrl: data.thumbnail_url ?? null,
	})
}

export async function scrapeReddit(url: string): Promise<ProviderResult> {
	const oembedUrl = `https://www.reddit.com/oembed?url=${encodeURIComponent(url)}`
	const data = await fetchJson<OEmbedResponse>(oembedUrl)
	if (!data) return {}
	return sanitize({
		title: data.title ?? null,
		author: data.author_name ?? null,
		thumbnailUrl: data.thumbnail_url ?? null,
	})
}

// Instagram oEmbed via Facebook Graph API — disabled until token auth is confirmed working.
// export async function scrapeInstagram(url: string): Promise<ProviderResult> {
// 	const token = process.env.INSTAGRAM_ACCESS_TOKEN
// 	if (!token) return {}
// 	const oembedUrl = `https://graph.facebook.com/v25.0/instagram_oembed?url=${encodeURIComponent(url)}&access_token=${encodeURIComponent(token)}&fields=title,author_name,thumbnail_url`
// 	const data = await fetchJson<OEmbedResponse>(oembedUrl)
// 	if (!data) return {}
// 	return sanitize({
// 		title: data.title ?? null,
// 		author: data.author_name ?? null,
// 		thumbnailUrl: data.thumbnail_url ?? null,
// 	})
// }

export async function scrapeGeneric(url: string): Promise<ProviderResult> {
	const html = await fetchHtml(url)
	if (!html) return {}
	return sanitize(parseOpenGraph(html))
}
