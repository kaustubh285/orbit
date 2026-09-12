import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { getQuestsCountOptions, getQuestsOptions, getQuestsQueryKey, patchQuestsByIdMutation, postQuestsMutation } from "@orbit/client"
import type { Quest } from "@/types"
import { useQuestsStore } from "@/store/quests.store"
import { useOrbitAppStore } from "@/store/orbit-app.store"
import { useEffect, useState } from "react"

const today = new Date().toISOString().split("T")[0]

export function useHome() {
	const selectedDate = useQuestsStore((state) => state.selectedDate)
	const questsCache = useQuestsStore((state) => state.questsCache)
	const { setCachedQuests } = useQuestsStore((state) => state.actions)
	const queryClient = useQueryClient()
	const { addPendingSubmission, removePendingSubmission } = useOrbitAppStore((s) => s.actions)
	const [bursts, setBursts] = useState(0);
	const incompleteQuests = useQuery(getQuestsOptions({ query: { status: "active" } }))?.data
		?.filter((q) => q.type !== "note" && q.type !== "event")
		.filter((q) => !!q.dueAt && q.dueAt.split("T")[0] < today)
		?? []

	const quests = useQuery(
		getQuestsOptions({ query: { date: selectedDate ?? undefined } }),
	)

	useEffect(() => {
		if (quests.isSuccess && quests.data) {
			setCachedQuests(selectedDate, quests.data)
		}
	}, [quests.isSuccess, quests.data, selectedDate])

	const rawQuests = (quests.isError
		? (questsCache[selectedDate] ?? [])
		: (quests.data ?? [])
	).filter((q) => q.type !== "note")

	const questsData = (() => {
		const childrenByParent = new Map<string, typeof rawQuests>()
		const topLevel: typeof rawQuests = []

		for (const q of rawQuests) {
			if (q.parentId) {
				const bucket = childrenByParent.get(q.parentId) ?? []
				bucket.push(q)
				childrenByParent.set(q.parentId, bucket)
			} else {
				topLevel.push(q)
			}
		}

		topLevel.sort((a, b) => {
			const statusOrder = { active: 0, completed: 1 }
			const statusDiff = (statusOrder[a.status as keyof typeof statusOrder] ?? 0) - (statusOrder[b.status as keyof typeof statusOrder] ?? 0)
			if (statusDiff !== 0) return statusDiff
			if (!a.dueAt && !b.dueAt) return 0
			if (!a.dueAt) return 1
			if (!b.dueAt) return -1
			return a.dueAt.localeCompare(b.dueAt)
		})

		const result: typeof rawQuests = []
		for (const q of topLevel) {
			result.push(q)
			result.push(...(childrenByParent.get(q.id) ?? []))
		}
		return result
	})()

	const createQuest = useMutation({
		...postQuestsMutation(),
		onSuccess: () => {
			// queryClient.invalidateQueries({ queryKey: getQuestsQueryKey() });
			// Re-fetch after AI parse completes in the background (title cleanup, dueAt, priority)
			setTimeout(() => queryClient.invalidateQueries({ queryKey: getQuestsQueryKey() }), 3500);
		},
	})

	const updateQuest = useMutation({
		...patchQuestsByIdMutation(),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: getQuestsQueryKey() }),
	})

	function submitQuest(title: string, type: Quest["type"]) {
		const trimmed = title.trim()
		if (!trimmed) return
		const id = crypto.randomUUID()
		const payload = { type, title: trimmed, dueAt: selectedDate ? new Date(`${selectedDate}T00:00:00`).toISOString() : null }
		addPendingSubmission({ id, createdAt: new Date().toISOString(), apiCallKey: "postQuest", payload })
		createQuest.mutate(
			{ body: payload } as Parameters<typeof createQuest.mutate>[0],
			{ onSuccess: () => removePendingSubmission(id) },
		)
	}

	function toggleQuest(quest: Quest) {
		const newStatus = quest.status === "completed" ? "active" : "completed"
		updateQuest.mutate({
			path: { id: quest.id },
			body: {
				status: newStatus,
				completedAt: newStatus === "completed" ? new Date().toISOString() : null,
			},
		} as Parameters<typeof updateQuest.mutate>[0])
		if (newStatus === "completed") {
			setBursts(b => b + 1)
			try{
				navigator.vibrate([100, 30, 100])
			}
			catch(e) {
				console.log(e)
			}
		}
	}

	function editQuest(id: string, body: Partial<Omit<Quest, "id">>) {
		updateQuest.mutate({
			path: { id },
			body,
		} as Parameters<typeof updateQuest.mutate>[0])
	}

	function moveQuestsToToday() {
		for (const quest of incompleteQuests) {
			if (!quest.dueAt) continue
			const existing = new Date(quest.dueAt)
			const hasTime = existing.getUTCHours() !== 0 || existing.getUTCMinutes() !== 0 || existing.getUTCSeconds() !== 0
			let newDueAt: string
			if (hasTime) {
				const [year, month, day] = today.split("-").map(Number)
				const updated = new Date(existing)
				updated.setUTCFullYear(year)
				updated.setUTCMonth(month - 1)
				updated.setUTCDate(day)
				newDueAt = updated.toISOString()
			} else {
				newDueAt = new Date(`${today}T00:00:00.000Z`).toISOString()
			}
			updateQuest.mutate({
				path: { id: quest.id },
				body: { dueAt: newDueAt },
			} as Parameters<typeof updateQuest.mutate>[0])
		}
	}

	const isFromCache = quests.isError && !!questsCache[selectedDate]

	return { quests, questsData, isFromCache, submitQuest, toggleQuest, editQuest, incompleteQuests, moveQuestsToToday, bursts, setBursts }
}

export function useQuestCounts(start: string, end: string) {
	return useQuery(getQuestsCountOptions({ query: { start, end } }))
}
