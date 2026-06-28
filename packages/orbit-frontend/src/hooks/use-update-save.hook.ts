import { deleteSavesById, deleteSavesByIdMutation, getListsQueryKey, getSavesQueryKey, patchSavesByIdMutation } from "@orbit/client"
import { useMutation, useQueryClient } from "@tanstack/react-query"


export const useUpdateSaveHook = () => {
	const queryClient = useQueryClient()

	const mutation = useMutation({
		...patchSavesByIdMutation(),
		onSuccess: () => Promise.all([
			queryClient.invalidateQueries({ queryKey: getSavesQueryKey() }),
			queryClient.invalidateQueries({ queryKey: getListsQueryKey() }),
		]),
	})

	const deleteMutation = useMutation({
		...deleteSavesByIdMutation(),
		onSuccess: () => Promise.all([
			queryClient.invalidateQueries({ queryKey: getSavesQueryKey() }),
			queryClient.invalidateQueries({ queryKey: getListsQueryKey() }),
			window.location.reload()
		]),
	})

	function updateSave(
		id: string,
		data: {
			title?: string | null
			description?: string | null
			note?: string | null
			status?: "active" | "archived"
			tags: string[]
			shouldAISummaries?: boolean
			aiSummary?: string | null
			listIds?: string[]
		},
		onSuccess?: () => void,
	) {
		mutation.mutate({ path: { id }, body: data }, { onSuccess })
	}

	function deleteSave(id: string, onSuccess?: () => void) {
		deleteMutation.mutate({ path: { id } }, { onSuccess })
	}

	return {
		updateSave,
		deleteSave,
		isUpdating: mutation.isPending,
		isSuccess: mutation.isSuccess,
		isError: mutation.isError,
	}
}
