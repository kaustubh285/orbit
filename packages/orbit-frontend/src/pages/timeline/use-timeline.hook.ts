import { getQuestsTimelineInfiniteOptions } from "@orbit/client"
import { useInfiniteQuery } from "@tanstack/react-query"
import type { Quest } from "@/types"

export type TimelineDay = {
	date: string        // YYYY-MM-DD
	relativeLabel: string
	remembrals: Quest[]
}

export type TimelineMonth = {
	monthLabel: string  // "April 2026"
	days: TimelineDay[]
}

function toYMD(iso: string): string {
	return iso.split("T")[0]
}

function relativeLabel(iso: string): string {
	const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
	if (days === 0) return "today"
	if (days === 1) return "yesterday"
	if (days < 7) return `${days} days ago`
	if (days < 14) return "last week"
	const weeks = Math.floor(days / 7)
	if (weeks < 5) return `${weeks} weeks ago`
	const months = Math.floor(days / 30)
	if (months < 12) return `${months} month${months > 1 ? "s" : ""} ago`
	const years = Math.floor(days / 365)
	return `${years} year${years > 1 ? "s" : ""} ago`
}

function monthLabel(ymd: string): string {
	const [year, month] = ymd.split("-")
	const date = new Date(Number(year), Number(month) - 1, 1)
	return date.toLocaleString("default", { month: "long", year: "numeric" })
}

function groupIntoTimeline(quests: Quest[]): TimelineMonth[] {
	const byDay = new Map<string, Quest[]>()

	for (const q of quests) {
		const ymd = toYMD(q.startAt ?? q.dueAt ?? new Date().toISOString())
		if (!byDay.has(ymd)) byDay.set(ymd, [])
		byDay.get(ymd)!.push(q)
	}

	const sortedDays = Array.from(byDay.entries()).sort((a, b) => b[0].localeCompare(a[0]))

	const byMonth = new Map<string, TimelineDay[]>()
	for (const [ymd, remembrals] of sortedDays) {
		const label = monthLabel(ymd)
		if (!byMonth.has(label)) byMonth.set(label, [])
		byMonth.get(label)!.push({
			date: ymd,
			relativeLabel: relativeLabel(ymd + "T12:00:00.000Z"),
			remembrals,
		})
	}

	return Array.from(byMonth.entries()).map(([ml, days]) => ({ monthLabel: ml, days }))
}

export function useTimeline() {
	const query = useInfiniteQuery({
		...getQuestsTimelineInfiniteOptions({ query: { limit: 20 } }),
		getNextPageParam: (lastPage: Quest[]) => {
			if (lastPage.length < 20) return undefined
			const oldest = lastPage[lastPage.length - 1]
			return oldest.startAt ?? undefined
		},
	})

	const allQuests = query.data?.pages.flat() ?? []
	const months = groupIntoTimeline(allQuests)

	return {
		months,
		isLoading: query.isLoading,
		isFetchingNextPage: query.isFetchingNextPage,
		hasNextPage: query.hasNextPage,
		fetchNextPage: query.fetchNextPage,
		isEmpty: !query.isLoading && allQuests.length === 0,
	}
}
