export type Quest = {
	id: string
	type: "todo" | "note" | "event" | "daily"
	status: "active" | "completed" | "archived"
	priority: "urgent" | "important" | "quick_win" | "deep_work" | "someday" | "waiting" | null
	title: string
	body: string | null
	dueAt: string | null
	completedAt: string | null
	startAt: string | null
	endAt: string | null
	location: string | null
	lastCompletedAt: string | null
	isRemembral: boolean
	emoji: string | null
}

export type List = {
	id: string
	userId: string
	name: string
	description: string | null
	color: string | null
	icon: string
	createdAt: string
	updatedAt: string
	recentSave?: Save | null
}

export type Save = {
	id: string;
	userId: string;
	sourceUrl: string;
	sourcePlatform: "youtube" | "reddit" | "instagram" | "web";
	title: string | null;
	description: string | null;
	thumbnailUrl: string | null;
	author: string | null;
	publishedAt: string | null;
	note: string | null;
	tags: string[];
	status: "active" | "archived";
	shouldAISummaries?: boolean;
	aiSummary: string | null;
	aiEnrichedAt: string | null;
	createdAt: string;
	updatedAt: string;
	lists?: string[];
	aiTitle: string | null;
}
