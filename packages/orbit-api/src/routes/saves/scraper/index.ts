import { detectPlatform } from "./platform.js"
import { scrapeGeneric, scrapeReddit, scrapeYouTube } from "./providers.js"
import { generateTags } from "./tags.js"
import type { ScrapedMeta } from "./types.js"

export { detectPlatform } from "./platform.js"
export type { Platform, ScrapedMeta } from "./types.js"

type ProviderResult = Partial<Omit<ScrapedMeta, "sourcePlatform">>

export interface ScrapeResult extends ScrapedMeta {
	tags: string[]
}

export async function scrapeUrl(url: string): Promise<ScrapeResult> {
	const sourcePlatform = detectPlatform(url)

	const provider =
		sourcePlatform === "youtube" ? scrapeYouTube :
			sourcePlatform === "reddit" ? scrapeReddit :
				scrapeGeneric

	const meta: ProviderResult = await provider(url).catch(() => ({}))

	const scraped: ScrapedMeta = {
		sourcePlatform,
		title: meta.title ?? null,
		description: meta.description ?? null,
		thumbnailUrl: meta.thumbnailUrl ?? null,
		author: meta.author ?? null,
		publishedAt: meta.publishedAt ?? null,
	}

	return {
		...scraped,
		tags: generateTags(scraped, url),
	}
}
