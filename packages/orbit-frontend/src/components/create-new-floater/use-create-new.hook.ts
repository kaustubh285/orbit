import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
	getListsOptions,
	getQuestsQueryKey, getSavesQueryKey,
	postQuestsMutation, postSavesMutation,
} from '@orbit/client'
import { useQuestsStore } from '@/store/quests.store'
import { useOrbitAppStore } from '@/store/orbit-app.store'
import type { Quest } from '@/types'

export type QuestFields = {
	dueAt: string | null
	body: string
	startAt: string | null
	endAt: string | null
	location: string
	isRemembral: boolean
	emoji: string | null
}

export function useCreateNew() {
	const selectedDate = useQuestsStore((s) => s.selectedDate)
	const queryClient = useQueryClient()
	const { addPendingSubmission, removePendingSubmission } = useOrbitAppStore((s) => s.actions)

	const lists = useQuery(getListsOptions())

	const createQuest = useMutation({
		...postQuestsMutation(),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: getQuestsQueryKey() }),
	})

	const createSave = useMutation({
		...postSavesMutation(),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: getSavesQueryKey() }),
	})

	function onSaveSubmit(sourceUrl: string, note?: string, listId?: string) {
		const id = crypto.randomUUID()
		const payload = {
			sourceUrl,
			...(note?.trim() ? { note: note.trim() } : {}),
			...(listId ? { listId } : {}),
		}
		addPendingSubmission({ id, createdAt: new Date().toISOString(), apiCallKey: "postSave", payload })
		createSave.mutate(
			{ body: payload } as Parameters<typeof createSave.mutate>[0],
			{ onSuccess: () => removePendingSubmission(id) },
		)
	}

	async function onQuestSubmit(title: string, type: Quest["type"], fields: QuestFields, listId?: string) {
		const payload: Record<string, unknown> = { type, title }

		if (type === 'todo') {
			payload.dueAt = fields.dueAt ?? (selectedDate ? new Date(`${selectedDate}T00:00:00.000Z`).toISOString() : null)
		} else if (type === 'note') {
			payload.body = fields.body.trim() || null
		} else if (type === 'event') {
			payload.startAt = fields.startAt ?? null
			payload.endAt = fields.endAt ?? null
			payload.location = fields.location.trim() || null
			payload.isRemembral = fields.isRemembral
			payload.emoji = fields.emoji
		}

		if (listId) payload.listId = listId

		const pendingId = crypto.randomUUID()
		addPendingSubmission({ id: pendingId, createdAt: new Date().toISOString(), apiCallKey: "postQuest", payload: payload as any })
		const quest = await createQuest.mutateAsync(
			{ body: payload } as Parameters<typeof createQuest.mutate>[0],
		)
		removePendingSubmission(pendingId)
		return quest
	}

	async function onHandleSubmit(
		mode: 'quest' | 'save',
		title: string,
		questType: Quest["type"],
		fields: QuestFields,
		saveNote: string,
		listId?: string,
	) {
		const trimmed = title.trim()
		if (!trimmed) return

		if (!listId) {
			const match = window.location.pathname.match(/^\/lists\/([^/]+)/)
			if (match) listId = match[1]
		}

		if (mode === 'save') {
			onSaveSubmit(trimmed, saveNote, listId)
			return null
		} else {
			return onQuestSubmit(trimmed, questType, fields, listId)
		}
	}

	return {
		lists: lists.data ?? [],
		onSaveSubmit,
		onQuestSubmit,
		onHandleSubmit,
		isPending: createQuest.isPending || createSave.isPending,
	}
}
