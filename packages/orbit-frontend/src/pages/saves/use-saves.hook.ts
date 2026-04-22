import { useAuth } from "@clerk/react"
import { getSavesOptions, getSavesQueryKey, postSavesMutation } from "@orbit/client"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

export function useSaves() {
	const queryClient = useQueryClient()
	const { userId } = useAuth()
	const saves = useQuery(
		getSavesOptions({
			headers: { "x-user-id": userId ?? "" },
		}),
	)

	const createSave = useMutation({
		...postSavesMutation(),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: getSavesQueryKey() })
		},
	})

	function addSave(url: string) {
		createSave.mutate({
			body: { sourceUrl: url },
			headers: { "x-user-id": userId ?? "" },
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
