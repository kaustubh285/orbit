import { getSavesOptions, getSavesQueryKey, postSavesMutation } from "@orbit/client"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

const USER_ID = "d26d0b6c-8525-4db7-9747-4b0aab4ed140" // temp until auth

export function useSaves() {
	const queryClient = useQueryClient()

	const saves = useQuery(
		getSavesOptions({
			headers: { "x-user-id": USER_ID },
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
			headers: { "x-user-id": USER_ID },
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
