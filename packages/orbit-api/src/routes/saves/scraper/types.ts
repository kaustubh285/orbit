export type Platform = "youtube" | "reddit" | "instagram" | "web"

export interface ScrapedMeta {
	sourcePlatform: Platform
	title: string | null
	description: string | null
	thumbnailUrl: string | null
	author: string | null
	publishedAt: Date | null
}
