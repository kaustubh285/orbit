import { getSavesQueryKey, patchSavesByIdMutation } from "@orbit/client"
import { useMutation, useQueryClient } from "@tanstack/react-query"

export const useUpdateSaveHook = () => {
	const queryClient = useQueryClient()

	const mutation = useMutation({
		...patchSavesByIdMutation(),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: getSavesQueryKey() }),
	})

	function updateSave(
		id: string,
		data: {
			title?: string | null
			description?: string | null
			note?: string | null
			status?: "active" | "archived",
			tags: string[]
			aiSummary?: string | null
		},
	) {
		mutation.mutate({ path: { id }, body: data })
	}

	return {
		updateSave,
		isUpdating: mutation.isPending,
		isSuccess: mutation.isSuccess,
		isError: mutation.isError,
	}
}
