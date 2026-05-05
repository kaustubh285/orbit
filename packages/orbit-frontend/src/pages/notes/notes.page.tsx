import { NotesView } from "./notes.view"
import { useNotesHook } from "./use-notes.hook"

export function NotesPage() {
	const { notes, isLoading, submitNote } = useNotesHook()

	return (
		<NotesView
			notes={notes}
			isLoading={isLoading}
			onSubmit={submitNote}
		/>
	)
}
