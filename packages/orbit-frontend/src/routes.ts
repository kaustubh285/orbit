const ROUTES = {
	HOME: "/",
	QUESTS: "/quests",
	SETTINGS: "/settings",
	SAVES: "/saves",
	LISTS: "/lists",
	LIST_DETAIL: "/lists/$id",
	NOTES: "/notes",
	NOTE_DETAIL: "/notes/$noteId",
	TIMELINE: "/timeline",
	REPORT: "/report",
	LOGIN: "/sign-in",
	RESURFACE: "/resurface",
} as const

export default ROUTES
