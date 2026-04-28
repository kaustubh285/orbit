import { getSavesOptions, getSavesQueryKey, postSavesMutation } from "@orbit/client"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

export function useSaves() {
	const queryClient = useQueryClient()

	const saves = useQuery(getSavesOptions())

	const createSave = useMutation({
		...postSavesMutation(),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: getSavesQueryKey() }),
	})

	function addSave(url: string) {
		createSave.mutate({
			body: { sourceUrl: url },
		} as Parameters<typeof createSave.mutate>[0])
	}

	return {
		saves: saves.data,
		isLoading: saves.isLoading,
		isError: saves.isError,
		refetch: saves.refetch,
		addSave,
		isAdding: createSave.isPending,
	}
}
