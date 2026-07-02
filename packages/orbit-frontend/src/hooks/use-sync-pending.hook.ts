import { useCallback, useEffect } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { getQuestsQueryKey, getSavesQueryKey, postQuestsMutation, postSavesMutation } from "@orbit/client"
import { useOrbitAppStore } from "@/store/orbit-app.store"

// Module-level flag — persists across component remounts so concurrent syncs can't double-submit
let isSyncing = false

export function useSyncPending() {
	const queryClient = useQueryClient()
	const removePendingSubmission = useOrbitAppStore((s) => s.actions.removePendingSubmission)

	const createQuest = useMutation({
		...postQuestsMutation(),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: getQuestsQueryKey() }),
	})

	const createSave = useMutation({
		...postSavesMutation(),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: getSavesQueryKey() }),
	})

	const sync = useCallback(async () => {
		if (isSyncing) return
		const { pendingSubmissions } = useOrbitAppStore.getState()
		if (pendingSubmissions.length === 0) return

		isSyncing = true
		try {
			for (const submission of pendingSubmissions) {
				try {
					if (submission.apiCallKey === "postQuest") {
						await createQuest.mutateAsync({ body: submission.payload } as Parameters<typeof createQuest.mutateAsync>[0])
					} else {
						await createSave.mutateAsync({ body: submission.payload } as Parameters<typeof createSave.mutateAsync>[0])
					}
					removePendingSubmission(submission.id)
				} catch {
					// leave in queue, will retry on next sync
				}
			}
		} finally {
			isSyncing = false
		}
	}, [createQuest, createSave, removePendingSubmission])

	// run automatically on mount
	useEffect(() => { sync() }, []) // eslint-disable-line react-hooks/exhaustive-deps

	return { sync }
}
