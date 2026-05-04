import { useEffect } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { getQuestsQueryKey, getSavesQueryKey, postQuestsMutation, postSavesMutation } from "@orbit/client"
import { useOrbitAppStore } from "@/store/orbit-app.store"

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

	useEffect(() => {
		const { pendingSubmissions } = useOrbitAppStore.getState()
		if (pendingSubmissions.length === 0) return

		;(async () => {
			for (const submission of pendingSubmissions) {
				try {
					if (submission.apiCallKey === "postQuest") {
						await createQuest.mutateAsync({ body: submission.payload } as Parameters<typeof createQuest.mutateAsync>[0])
					} else {
						await createSave.mutateAsync({ body: submission.payload } as Parameters<typeof createSave.mutateAsync>[0])
					}
					removePendingSubmission(submission.id)
				} catch {
					// leave in queue, will retry on next app open
				}
			}
		})()
	}, []) // eslint-disable-line react-hooks/exhaustive-deps
}
