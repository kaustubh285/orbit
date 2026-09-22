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

interface RedditPost {
	title: string
	selftext: string
	author: string
	created_utc: number
	thumbnail: string
	preview?: { images?: Array<{ source: { url: string } }> }
}

const REDDIT_NON_IMAGE_THUMBNAILS = new Set(["self", "default", "nsfw", "spoiler", "image", ""])

export async function scrapeReddit(url: string): Promise<ProviderResult> {
	const match = url.match(/reddit\.com\/r\/[^/]+\/comments\/([a-z0-9]+)/i)
	if (!match) return {}

	const postId = match[1]
	const jsonUrl = `https://www.reddit.com/comments/${postId}.json?raw_json=1&limit=1`
	const data = await fetchJson<[{ data: { children: Array<{ data: RedditPost }> } }]>(
		jsonUrl,
		{ headers: { Accept: "application/json" } },
	)
	console.log("[scrapeReddit] postId:", postId, "data:", data == null ? "null" : "ok")
	const post = data?.[0]?.data?.children?.[0]?.data
	if (!post) return {}

	// preview.images gives higher-res images than the `thumbnail` field
	// Reddit HTML-encodes preview URLs, so decode & before using
	const previewUrl = post.preview?.images?.[0]?.source?.url?.replace(/&amp;/g, "&") ?? null
	const thumbnailUrl = previewUrl
		?? (REDDIT_NON_IMAGE_THUMBNAILS.has(post.thumbnail ?? "") ? null : (post.thumbnail ?? null))

	return sanitize({
		title: post.title ?? null,
		description: post.selftext?.trim() || null,
		author: post.author ? `u/${post.author}` : null,
		thumbnailUrl,
		publishedAt: post.created_utc ? new Date(post.created_utc * 1000).toISOString() : null,
	})
}

const MOBILE_UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"

export async function scrapeInstagram(url: string): Promise<ProviderResult> {
	const oembedUrl = `https://www.instagram.com/api/v1/oembed/?url=${encodeURIComponent(url)}&hidecaption=false`
	const data = await fetchJson<OEmbedResponse>(oembedUrl)

	let thumbnailUrl = data?.thumbnail_url ?? null

	// oEmbed returns type "rich" for reels and doesn't always include thumbnail_url.
	// Fall back to og:image from the page with a mobile UA which Instagram serves properly.
	if (!thumbnailUrl) {
		const html = await fetchHtml(url, { headers: { "User-Agent": MOBILE_UA } })
		if (html) thumbnailUrl = parseOpenGraph(html).thumbnailUrl ?? null
	}

	return sanitize({
		title: data?.title ?? null,
		author: data?.author_name ?? null,
		thumbnailUrl,
	})
}

export async function scrapeGeneric(url: string): Promise<ProviderResult> {
	const html = await fetchHtml(url)
	if (!html) return {}
	return sanitize(parseOpenGraph(html))
}
