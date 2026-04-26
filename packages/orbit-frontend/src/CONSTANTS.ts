import { IconCalendarEvent, IconFileText, IconRefresh, IconSquareCheck } from "@tabler/icons-react"
import type { Quest } from "./types"

export const PRIORITY_COLOR: Record<NonNullable<Quest["priority"]>, string> = {
	urgent: "red",
	important: "orange",
	quick_win: "green",
	deep_work: "indigo",
	someday: "gray",
	waiting: "yellow",
}

export const TYPE_ICON = {
	todo: IconSquareCheck,
	note: IconFileText,
	event: IconCalendarEvent,
	daily: IconRefresh,
}

export const TYPE_COLOR = {
	todo: "blue",
	note: "gray",
	event: "pink",
	daily: "teal",
}
