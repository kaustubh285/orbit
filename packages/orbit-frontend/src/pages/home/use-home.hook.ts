import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { getQuestsOptions, getQuestsQueryKey, patchQuestsByIdMutation, postQuestsMutation } from "@orbit/client"
import type { Quest } from "@/types"
import { useAuth } from "@clerk/react"

export function useHome(date: string | null) {
	const queryClient = useQueryClient()
	const { userId } = useAuth()
	const quests = useQuery(
		getQuestsOptions({
			query: { date: date ?? undefined },
			headers: { "x-user-id": userId ?? "" },
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
			body: { type, title: trimmed, dueAt: date ? new Date(`${date}T00:00:00.000Z`).toISOString() : null },
			headers: { "x-user-id": userId ?? "" },
		} as Parameters<typeof createQuest.mutate>[0])
	}

	function toggleQuest(quest: Quest) {
		const newStatus = quest.status === "completed" ? "active" : "completed"
		updateQuest.mutate({
			path: { id: quest.id },
			body: { status: newStatus },
			headers: { "x-user-id": userId ?? "" },
		} as Parameters<typeof updateQuest.mutate>[0])
	}

	function editQuest(id: string, body: Partial<Omit<Quest, "id">>) {
		updateQuest.mutate({
			path: { id },
			body,
			headers: { "x-user-id": userId ?? "" },
		} as Parameters<typeof updateQuest.mutate>[0])
	}

	return { quests, submitQuest, toggleQuest, editQuest }
}
