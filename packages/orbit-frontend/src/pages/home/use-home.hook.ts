import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { getQuestsOptions, getQuestsQueryKey, patchQuestsByIdMutation, postQuestsMutation } from "@orbit/client"
import type { Quest } from "@/types"
import { useQuestsStore } from "@/store/quests.store"

export function useHome() {
	const selectedDate = useQuestsStore((state) => state.selectedDate)
	const queryClient = useQueryClient()

	const quests = useQuery(
		getQuestsOptions({
			query: { date: selectedDate ?? undefined },
		}),
	)

	const createQuest = useMutation({
		...postQuestsMutation(),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: getQuestsQueryKey() })
		},
	})

	const updateQuest = useMutation({
		...patchQuestsByIdMutation(),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: getQuestsQueryKey() })
		},
	})

	function submitQuest(title: string, type: Quest["type"]) {
		const trimmed = title.trim()
		if (!trimmed) return
		createQuest.mutate({
			body: { type, title: trimmed, dueAt: selectedDate ? new Date(`${selectedDate}T00:00:00.000Z`).toISOString() : null },
		} as Parameters<typeof createQuest.mutate>[0])
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
	}

	function editQuest(id: string, body: Partial<Omit<Quest, "id">>) {
		updateQuest.mutate({
			path: { id },
			body,
		} as Parameters<typeof updateQuest.mutate>[0])
	}

	return { quests, submitQuest, toggleQuest, editQuest }
}
