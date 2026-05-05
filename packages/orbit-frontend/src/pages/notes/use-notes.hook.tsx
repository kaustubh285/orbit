import { getQuestsOptions, getQuestsQueryKey, patchQuestsByIdMutation, postQuestsMutation } from "@orbit/client"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

export function useNotesHook() {
	const queryClient = useQueryClient()

	const notes = useQuery(
		getQuestsOptions({ query: { type: "note" } }),
	)

	const createNote = useMutation({
		...postQuestsMutation(),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: getQuestsQueryKey() }),
	})

	const updateNote = useMutation({
		...patchQuestsByIdMutation(),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: getQuestsQueryKey() }),
	})

	function submitNote(title: string) {
		const trimmed = title.trim()
		if (!trimmed) return
		return createNote.mutateAsync({ body: { type: "note", title: trimmed } } as Parameters<typeof createNote.mutate>[0])
	}

	return {
		notes: notes.data ?? [],
		isLoading: notes.isLoading,
		submitNote,
		updateNote,
	}
}
