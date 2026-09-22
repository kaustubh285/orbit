import { deleteQueueIdMutation, getQueueOptions, getQueueQueryKey } from "@orbit/client"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

export function useQueue() {
	const queryClient = useQueryClient()

	const queue = useQuery(getQueueOptions())

	const remove = useMutation({
		...deleteQueueIdMutation(),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: getQueueQueryKey() }),
	})

	return {
		items: queue.data ?? [],
		isLoading: queue.isLoading,
		removeItem: (id: string) => remove.mutate({ path: { id } }),
		isRemoving: remove.isPending,
	}
}
