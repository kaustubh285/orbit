import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
	deleteListsByIdMutation,
	getListsOptions,
	getListsQueryKey,
	patchListsByIdMutation,
	postListsMutation,
} from '@orbit/client'

export function useLists() {
	const queryClient = useQueryClient()
	const invalidate = () => queryClient.invalidateQueries({ queryKey: getListsQueryKey() })

	const lists = useQuery(getListsOptions())

	const createList = useMutation({ ...postListsMutation(), onSuccess: invalidate })
	const updateList = useMutation({ ...patchListsByIdMutation(), onSuccess: invalidate })
	const deleteList = useMutation({ ...deleteListsByIdMutation(), onSuccess: invalidate })

	function onCreate(name: string, description?: string, color?: string) {
		createList.mutate({
			body: { name, description: description || null, color: color || null },
		} as Parameters<typeof createList.mutate>[0])
	}

	function onUpdate(id: string, name: string, description?: string, color?: string) {
		updateList.mutate({
			path: { id },
			body: { name, description: description || null, color: color || null },
		} as Parameters<typeof updateList.mutate>[0])
	}

	function onDelete(id: string) {
		deleteList.mutate({
			path: { id },
		} as Parameters<typeof deleteList.mutate>[0])
	}

	return {
		lists: lists.data ?? [],
		isLoading: lists.isLoading,
		onCreate,
		onUpdate,
		onDelete,
		isCreating: createList.isPending,
		isDeleting: deleteList.isPending,
	}
}
