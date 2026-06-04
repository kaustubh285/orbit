import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
	deleteListsByIdItemsByItemIdMutation,
	getListsByIdOptions,
	getListsByIdQueryKey,
	patchListsByIdMutation,
	patchQuestsByIdMutation,
	postListsByIdItemsMutation,
	postQuestsMutation,
} from '@orbit/client'
import type { Quest } from '@/types'

export function useListDetail(id: string) {
	const queryClient = useQueryClient()
	const invalidate = () => queryClient.invalidateQueries({ queryKey: getListsByIdQueryKey({ path: { id } }) })

	const detail = useQuery(getListsByIdOptions({ path: { id } }))

	const updateList = useMutation({ ...patchListsByIdMutation(), onSuccess: invalidate })
	const addItem = useMutation({ ...postListsByIdItemsMutation(), onSuccess: invalidate })
	const removeItem = useMutation({ ...deleteListsByIdItemsByItemIdMutation(), onSuccess: invalidate })
	const createQuest = useMutation({ ...postQuestsMutation() })
	const patchQuest = useMutation({ ...patchQuestsByIdMutation(), onSuccess: invalidate })

	function onUpdate(name: string, description?: string, color?: string, icon?: string) {
		updateList.mutate({
			path: { id },
			body: { name, description: description ?? null, color: color ?? null, icon },
		} as Parameters<typeof updateList.mutate>[0])
	}

	function onRemoveItem(itemId: string) {
		removeItem.mutate({
			path: { id, itemId },
		} as Parameters<typeof removeItem.mutate>[0])
	}

	async function submitQuest(title: string, type: Quest["type"]) {
		const quest = await createQuest.mutateAsync({ body: { title, type } } as Parameters<typeof createQuest.mutateAsync>[0])
		addItem.mutate({ path: { id }, body: { questId: quest.id } } as Parameters<typeof addItem.mutate>[0])
	}

	function toggleQuest(quest: Quest) {
		const status = quest.status === 'completed' ? 'active' : 'completed'
		patchQuest.mutate({ path: { id: quest.id }, body: { status } } as Parameters<typeof patchQuest.mutate>[0])
	}

	return {
		list: detail.data,
		isLoading: detail.isLoading,
		isError: detail.isError,
		onUpdate,
		onRemoveItem,
		submitQuest,
		toggleQuest,
		isUpdating: updateList.isPending,
		isRemovingItem: removeItem.isPending,
	}
}
