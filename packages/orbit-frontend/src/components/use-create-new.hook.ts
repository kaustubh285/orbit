import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
	getQuestsQueryKey, getSavesQueryKey,
	postQuestsMutation, postSavesMutation,
} from '@orbit/client'
import { useQuestsStore } from '@/store/quests.store'
import type { Quest } from '@/types'

export type QuestFields = {
	dueAt: string | null
	body: string
	startAt: string | null
	endAt: string | null
	location: string
}

export function useCreateNew() {
	const selectedDate = useQuestsStore((s) => s.selectedDate)
	const queryClient = useQueryClient()

	const createQuest = useMutation({
		...postQuestsMutation(),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: getQuestsQueryKey() }),
	})

	const createSave = useMutation({
		...postSavesMutation(),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: getSavesQueryKey() }),
	})

	function onSaveSubmit(sourceUrl: string, note?: string) {
		createSave.mutate({
			body: {
				sourceUrl,
				...(note?.trim() ? { note: note.trim() } : {}),
			},
		} as Parameters<typeof createSave.mutate>[0])
	}

	function onQuestSubmit(title: string, type: Quest["type"], fields: QuestFields) {
		const body: Record<string, unknown> = { type, title }

		if (type === 'todo') {
			body.dueAt = fields.dueAt ?? (selectedDate ? new Date(`${selectedDate}T00:00:00.000Z`).toISOString() : null)
		} else if (type === 'note') {
			body.body = fields.body.trim() || null
		} else if (type === 'event') {
			body.startAt = fields.startAt ?? null
			body.endAt = fields.endAt ?? null
			body.location = fields.location.trim() || null
		}

		createQuest.mutate({ body } as Parameters<typeof createQuest.mutate>[0])
	}

	function onHandleSubmit(
		mode: 'quest' | 'save',
		title: string,
		questType: Quest["type"],
		fields: QuestFields,
		saveNote: string,
	) {
		const trimmed = title.trim()
		if (!trimmed) return

		if (mode === 'save') {
			onSaveSubmit(trimmed, saveNote)
		} else {
			onQuestSubmit(trimmed, questType, fields)
		}
	}

	return {
		onSaveSubmit,
		onQuestSubmit,
		onHandleSubmit,
		isPending: createQuest.isPending || createSave.isPending,
	}
}
