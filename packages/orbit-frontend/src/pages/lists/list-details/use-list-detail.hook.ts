import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
	deleteListsByIdItemsByItemIdMutation,
	getListsByIdOptions,
	getListsByIdQueryKey,
	patchListsByIdMutation,
	postListsByIdItemsMutation,
} from '@orbit/client'

export function useListDetail(id: string) {
	const queryClient = useQueryClient()
	const invalidate = () => queryClient.invalidateQueries({ queryKey: getListsByIdQueryKey({ path: { id } }) })

	const detail = useQuery(getListsByIdOptions({ path: { id } }))

	const updateList = useMutation({ ...patchListsByIdMutation(), onSuccess: invalidate })
	const addItem = useMutation({ ...postListsByIdItemsMutation(), onSuccess: invalidate })
	const removeItem = useMutation({ ...deleteListsByIdItemsByItemIdMutation(), onSuccess: invalidate })

	function onUpdate(name: string, description?: string, color?: string) {
		updateList.mutate({
			path: { id },
			body: { name, description: description ?? null, color: color ?? null },
		} as Parameters<typeof updateList.mutate>[0])
	}

	function onRemoveItem(itemId: string) {
		removeItem.mutate({
			path: { id, itemId },
		} as Parameters<typeof removeItem.mutate>[0])
	}

	return {
		list: detail.data,
		isLoading: detail.isLoading,
		isError: detail.isError,
		onUpdate,
		onRemoveItem,
		isUpdating: updateList.isPending,
		isRemovingItem: removeItem.isPending,
	}
}
