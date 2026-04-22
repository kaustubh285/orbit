import { detectPlatform } from "./platform.js"
import { scrapeGeneric, scrapeReddit, scrapeYouTube } from "./providers.js"
import type { ScrapedMeta } from "./types.js"

export { detectPlatform } from "./platform.js"
export type { Platform, ScrapedMeta } from "./types.js"

type ProviderResult = Partial<Omit<ScrapedMeta, "sourcePlatform">>

export async function scrapeUrl(url: string): Promise<ScrapedMeta> {
	const sourcePlatform = detectPlatform(url)

	const provider =
		sourcePlatform === "youtube" ? scrapeYouTube :
		sourcePlatform === "reddit" ? scrapeReddit :
		scrapeGeneric

	const meta: ProviderResult = await provider(url).catch(() => ({}))

	return {
		sourcePlatform,
		title: meta.title ?? null,
		description: meta.description ?? null,
		thumbnailUrl: meta.thumbnailUrl ?? null,
		author: meta.author ?? null,
		publishedAt: meta.publishedAt ?? null,
	}
}
