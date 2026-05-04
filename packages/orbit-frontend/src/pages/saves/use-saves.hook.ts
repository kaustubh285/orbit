import { getSavesOptions, getSavesQueryKey, postSavesMutation } from "@orbit/client"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useOrbitAppStore } from "@/store/orbit-app.store"

export function useSaves() {
	const queryClient = useQueryClient()
	const { addPendingSubmission, removePendingSubmission } = useOrbitAppStore((s) => s.actions)

	const saves = useQuery(getSavesOptions())

	const createSave = useMutation({
		...postSavesMutation(),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: getSavesQueryKey() }),
	})

	function addSave(url: string) {
		const id = crypto.randomUUID()
		const payload = { sourceUrl: url }
		addPendingSubmission({ id, createdAt: new Date().toISOString(), apiCallKey: "postSave", payload })
		createSave.mutate(
			{ body: payload } as Parameters<typeof createSave.mutate>[0],
			{ onSuccess: () => removePendingSubmission(id) },
		)
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
