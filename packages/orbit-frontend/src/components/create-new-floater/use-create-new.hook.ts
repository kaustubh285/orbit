import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
	getListsOptions,
	getQuestsQueryKey, getSavesQueryKey,
	postQuestsMutation, postSavesMutation,
} from '@orbit/client'
import { useQuestsStore } from '@/store/quests.store'
import { useOrbitAppStore } from '@/store/orbit-app.store'
import type { List } from '@/types'
import { useState } from 'react'
import { getLists } from '@orbit/client'


export type UiType = 'todo' | 'note' | 'event' | 'memory' | 'daily' | 'save'

export type QuestFields = {
	dueAt: string | null
	startAt: string | null
	endAt: string | null
	location: string
	emoji: string | null
}

export function useCreateNew() {
	const selectedDate = useQuestsStore((s) => s.selectedDate)
	const queryClient = useQueryClient()
	const { addPendingSubmission, removePendingSubmission, setCurrentLists } = useOrbitAppStore((s) => s.actions)
	const lists = useOrbitAppStore((s) => s.currentLists)
	const [isRefetchingLists, setIsRefetchingLists] = useState(false)

	async function refetchLists() {
		setIsRefetchingLists(true)
		try {
			const { data } = await getLists({})
			if (data) setCurrentLists(data as List[])
		} finally {
			setIsRefetchingLists(false)
		}
	}

	const createQuest = useMutation({
		...postQuestsMutation(),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: getQuestsQueryKey() }),
	})

	const createSave = useMutation({
		...postSavesMutation(),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: getSavesQueryKey() }),
	})

	function submitSave(sourceUrl: string, note?: string, listId?: string, shouldAISummaries?: boolean) {
		const pendingId = crypto.randomUUID()
		const payload = {
			sourceUrl,
			...(note?.trim() ? { note: note.trim() } : {}),
			...(listId ? { listId } : {}),
			shouldAISummaries: shouldAISummaries ?? false,
		}
		addPendingSubmission({ id: pendingId, createdAt: new Date().toISOString(), apiCallKey: 'postSave', payload })
		createSave.mutate(
			{ body: payload } as Parameters<typeof createSave.mutate>[0],
			{ onSuccess: () => removePendingSubmission(pendingId) },
		)
	}

	async function submitQuest(uiType: Exclude<UiType, 'save'>, title: string, fields: QuestFields, listId?: string) {
		const questType = uiType === 'memory' ? 'event' : uiType
		const payload: Record<string, unknown> = { type: questType, title }

		if (uiType === 'todo') {
			payload.dueAt = fields.dueAt ?? (selectedDate ? new Date(`${selectedDate}T00:00:00.000Z`).toISOString() : null)
		} else if (uiType === 'event') {
			payload.startAt = fields.startAt
			payload.endAt = fields.endAt
			payload.location = fields.location.trim() || null
		} else if (uiType === 'memory') {
			payload.startAt = fields.startAt
			payload.isRemembral = true
			payload.emoji = fields.emoji
		}

		if (listId) payload.listId = listId

		const pendingId = crypto.randomUUID()
		addPendingSubmission({ id: pendingId, createdAt: new Date().toISOString(), apiCallKey: 'postQuest', payload: payload as any })
		const quest = await createQuest.mutateAsync({ body: payload } as Parameters<typeof createQuest.mutate>[0])
		removePendingSubmission(pendingId)
		return quest
	}

	async function onSubmit(uiType: UiType, title: string, fields: QuestFields, saveNote: string, listId?: string, shouldAISummaries?: boolean) {
		const trimmed = title.trim()
		if (!trimmed) return null

		// Auto-inherit list from current URL (e.g. /lists/:id)
		if (!listId) {
			const match = window.location.pathname.match(/^\/lists\/([^/]+)/)
			if (match) listId = match[1]
		}

		if (uiType === 'save') {
			submitSave(trimmed, saveNote, listId, shouldAISummaries)
			return null
		}

		return submitQuest(uiType, trimmed, fields, listId)
	}

	return {
		lists,
		onSubmit,
		isPending: createQuest.isPending || createSave.isPending,
		refetchLists,
		isRefetchingLists,
	}
}
