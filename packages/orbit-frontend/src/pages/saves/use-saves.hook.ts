import { getSavesOptions, getSavesQueryKey, postSavesMutation } from "@orbit/client"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useOrbitAppStore } from "@/store/orbit-app.store"
import { useMediaQuery } from "@mantine/hooks"

export function useSaves() {
	const queryClient = useQueryClient()
	const { addPendingSubmission, removePendingSubmission } = useOrbitAppStore((s) => s.actions)
	const isDesktop = useMediaQuery("(min-width: 48em)", false, { getInitialValueInEffect: false })

	const saves = useQuery(getSavesOptions())

	const createSave = useMutation({
		...postSavesMutation(),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: getSavesQueryKey() }),
	})

	function addSave(url: string) {
		const id = crypto.randomUUID()
		const listMatch = window.location.pathname.match(/^\/lists\/([^/]+)/)
		const payload = {
			sourceUrl: url,
			...(listMatch ? { listId: listMatch[1] } : {}),
		}
		addPendingSubmission({ id, createdAt: new Date().toISOString(), apiCallKey: "postSave", payload })
		createSave.mutate(
			{ body: payload } as Parameters<typeof createSave.mutate>[0],
			{ onSuccess: () => removePendingSubmission(id) },
		)
	}

	const mostRecentFiveSaves = useQuery(
		getSavesOptions({ query: { limit: isDesktop ? 10 : 5 } })
	)

	return {
		saves: saves.data,
		isLoading: saves.isLoading,
		isError: saves.isError,
		refetch: saves.refetch,
		addSave,
		isAdding: createSave.isPending,
		mostRecentFiveSaves: mostRecentFiveSaves.data,
		mostRecentFiveSavesIsLoading: mostRecentFiveSaves.isLoading,
	}
}
