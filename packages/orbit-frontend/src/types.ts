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
}
