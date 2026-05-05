import type { Quest } from "@/types"
import { ActionIcon, Box, Group, Skeleton, Stack, Text, TextInput } from "@mantine/core"
import { IconFileText, IconPlus } from "@tabler/icons-react"
import { useNavigate } from "@tanstack/react-router"
import { useState } from "react"
import ROUTES from "@/routes"

function NoteCard({ note, onClick }: { note: Quest; onClick: () => void }) {
	const preview = note.body
		? note.body.replace(/<[^>]+>/g, "").slice(0, 80)
		: null

	return (
		<Box
			onClick={onClick}
			style={{
				padding: "10px 12px",
				borderRadius: 8,
				border: "1px solid var(--mantine-color-dark-4)",
				cursor: "pointer",
				background: "var(--mantine-color-dark-7)",
			}}
		>
			<Group gap="xs" mb={preview ? 4 : 0}>
				<IconFileText size={14} color="var(--mantine-color-gray-5)" />
				<Text size="sm" fw={500} style={{ flex: 1 }}>
					{note.title}
				</Text>
			</Group>
			{preview && (
				<Text size="xs" c="dimmed" lineClamp={2} pl={22}>
					{preview}
				</Text>
			)}
		</Box>
	)
}

function NewNoteInput({ onSubmit }: { onSubmit: (title: string) => void }) {
	const [value, setValue] = useState("")

	function submit() {
		if (!value.trim()) return
		onSubmit(value)
		setValue("")
	}

	return (
		<Group gap="xs">
			<TextInput
				placeholder="New note..."
				value={value}
				onChange={(e) => setValue(e.currentTarget.value)}
				onKeyDown={(e) => { if (e.key === "Enter") submit() }}
				style={{ flex: 1 }}
				variant="filled"
				size="sm"
			/>
			<ActionIcon onClick={submit} variant="light" size="lg">
				<IconPlus size={16} />
			</ActionIcon>
		</Group>
	)
}

export function NotesView({
	notes,
	isLoading,
	onSubmit,
}: {
	notes: Quest[]
	isLoading: boolean
	onSubmit: (title: string) => void
}) {
	const navigate = useNavigate()

	if (isLoading) {
		return (
			<Stack gap="xs">
				{[1, 2, 3].map((i) => <Skeleton key={i} height={60} radius={8} />)}
			</Stack>
		)
	}

	return (
		<Stack gap="xs">
			<NewNoteInput onSubmit={onSubmit} />
			{notes.length === 0 ? (
				<Text size="sm" c="dimmed" ta="center" mt="xl">
					No notes yet. Create one above.
				</Text>
			) : (
				notes.map((note) => (
					<NoteCard
						key={note.id}
						note={note}
						onClick={() => navigate({ to: ROUTES.NOTE_DETAIL, params: { noteId: note.id } })}
					/>
				))
			)}
		</Stack>
	)
}
