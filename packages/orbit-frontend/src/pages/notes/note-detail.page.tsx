import { getQuestsByIdOptions, getQuestsQueryKey, patchQuestsByIdMutation } from "@orbit/client"
import { ActionIcon, Box, Button, Group, Skeleton, Text, TextInput } from "@mantine/core"
import { RichTextEditor } from "@mantine/tiptap"
import { useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import LinkExtension from "@tiptap/extension-link"
import { IconArrowLeft } from "@tabler/icons-react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate, useParams } from "@tanstack/react-router"
import { useState } from "react"

function NoteEditor({ noteId, initialTitle, initialBody }: {
	noteId: string
	initialTitle: string
	initialBody: string | null
}) {
	const queryClient = useQueryClient()
	const [title, setTitle] = useState(initialTitle)

	const updateNote = useMutation({
		...patchQuestsByIdMutation(),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: getQuestsQueryKey() }),
	})

	const editor = useEditor({
		extensions: [
			StarterKit,
			LinkExtension.configure({ openOnClick: false }),
		],
		content: initialBody ?? "",
	})

	function handleSave() {
		const trimmed = title.trim()
		if (!trimmed) return
		updateNote.mutate({
			path: { id: noteId },
			body: {
				title: trimmed,
				body: editor?.getHTML() ?? null,
			},
		} as Parameters<typeof updateNote.mutate>[0])
	}

	return (
		<Box style={{ display: "flex", flexDirection: "column", height: "100%" }}>
			<Group justify="space-between" mb="xs">
				<TextInput
					value={title}
					onChange={(e) => setTitle(e.currentTarget.value)}
					variant="unstyled"
					style={{ flex: 1 }}
					styles={{ input: { fontSize: 20, fontWeight: 600, padding: 0 } }}
				/>
				<Button
					size="xs"
					onClick={handleSave}
					loading={updateNote.isPending}
				>
					Save
				</Button>
			</Group>

			<RichTextEditor editor={editor} style={{ flex: 1, border: "none" }}>
				<RichTextEditor.Toolbar sticky>
					<RichTextEditor.ControlsGroup>
						<RichTextEditor.Bold />
						<RichTextEditor.Italic />
						<RichTextEditor.Strikethrough />
						<RichTextEditor.Code />
					</RichTextEditor.ControlsGroup>
					<RichTextEditor.ControlsGroup>
						<RichTextEditor.H1 />
						<RichTextEditor.H2 />
						<RichTextEditor.H3 />
					</RichTextEditor.ControlsGroup>
					<RichTextEditor.ControlsGroup>
						<RichTextEditor.BulletList />
						<RichTextEditor.OrderedList />
					</RichTextEditor.ControlsGroup>
					<RichTextEditor.ControlsGroup>
						<RichTextEditor.Link />
						<RichTextEditor.Unlink />
					</RichTextEditor.ControlsGroup>
					<RichTextEditor.ControlsGroup>
						<RichTextEditor.CodeBlock />
					</RichTextEditor.ControlsGroup>
				</RichTextEditor.Toolbar>
				<RichTextEditor.Content />
			</RichTextEditor>
		</Box>
	)
}

export function NoteDetailPage() {
	const { noteId } = useParams({ from: "/notes/$noteId" })
	const navigate = useNavigate()

	const { data: note, isLoading } = useQuery(
		getQuestsByIdOptions({ path: { id: noteId } }),
	)

	if (isLoading) {
		return (
			<Box p="md">
				<Skeleton height={30} mb="sm" />
				<Skeleton height={200} />
			</Box>
		)
	}

	if (!note) {
		return <Text c="dimmed" ta="center" mt="xl">Note not found.</Text>
	}

	return (
		<Box style={{ display: "flex", flexDirection: "column", height: "100%" }}>
			<Group mb="md">
				<ActionIcon variant="subtle" onClick={() => navigate({ to: "/notes" })}>
					<IconArrowLeft size={18} />
				</ActionIcon>
				<Text size="xs" c="dimmed">Notes</Text>
			</Group>
			<NoteEditor
				key={note.id}
				noteId={note.id}
				initialTitle={note.title}
				initialBody={note.body}
			/>
		</Box>
	)
}
