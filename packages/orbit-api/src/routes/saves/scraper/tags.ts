import type { ScrapedMeta } from "./types.js"

const STOP_WORDS = new Set([
	"this", "that", "with", "from", "have", "been", "were", "they",
	"their", "about", "which", "when", "there", "what", "your", "will",
	"more", "also", "just", "into", "than", "some", "very", "much",
	"after", "before", "these", "those", "other", "first", "then",
])

const MAX_TITLE_KEYWORDS = 5
const MAX_TAGS = 12

export function generateTags(meta: ScrapedMeta, sourceUrl: string): string[] {
	const tags = new Set<string>()

	tags.add(meta.sourcePlatform)

	if (meta.sourcePlatform === "web") {
		try {
			const hostname = new URL(sourceUrl).hostname.replace(/^www\./, "")
			if (hostname) tags.add(hostname)
		} catch { /* ignore malformed urls */ }
	}

	if (meta.sourcePlatform === "youtube") {
		if (meta.author) tags.add(meta.author.toLowerCase())
		tags.add("video")
	}

	if (meta.sourcePlatform === "reddit" && meta.author) {
		// author_name from Reddit oEmbed is "r/subredditname"
		const subreddit = meta.author.replace(/^r\//, "").toLowerCase()
		if (subreddit) tags.add(subreddit)
	}

	if (meta.sourcePlatform === "instagram") {
		tags.add(sourceUrl.includes("/reel/") ? "reel" : "post")
		if (meta.author) tags.add(meta.author.toLowerCase())
	}

	if (meta.title) {
		const keywords = meta.title
			.toLowerCase()
			.replace(/[^\w\s]/g, " ")
			.split(/\s+/)
			.filter((w) => w.length > 4 && !STOP_WORDS.has(w))

		let added = 0
		for (const word of keywords) {
			if (added >= MAX_TITLE_KEYWORDS) break
			tags.add(word)
			added++
		}
	}

	return [...tags].slice(0, MAX_TAGS)
}
