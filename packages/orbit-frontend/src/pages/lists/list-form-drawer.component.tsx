import type { List } from '@/types'
import { Button, ColorSwatch, Drawer, Group, Stack, Text, Textarea, TextInput } from '@mantine/core'
import { useState } from 'react'
import { PRESET_COLORS } from './lists.utils'

export function ListFormDrawer({
	opened,
	onClose,
	onSubmit,
	isPending,
	initial,
}: {
	opened: boolean
	onClose: () => void
	onSubmit: (name: string, description?: string, color?: string) => void
	isPending: boolean
	initial?: Pick<List, 'name' | 'description' | 'color'>
}) {
	const [name, setName] = useState(initial?.name ?? '')
	const [description, setDescription] = useState(initial?.description ?? '')
	const [color, setColor] = useState<string | null>(initial?.color ?? null)

	const isEdit = !!initial

	function handleClose() {
		onClose()
	}

	function handleSubmit() {
		if (!name.trim()) return
		onSubmit(name.trim(), description.trim() || undefined, color ?? undefined)
		handleClose()
	}

	return (
		<Drawer
			position="bottom"
			size="md"
			opened={opened}
			onClose={handleClose}
			title={isEdit ? 'Edit list' : 'New list'}
			styles={{
				content: { display: 'flex', flexDirection: 'column' },
				body: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' },
			}}
		>
			<Stack gap="md" h="100%">
				<TextInput
					placeholder="List name…"
					value={name}
					onChange={(e) => setName(e.currentTarget.value)}
					autoFocus
					onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit() }}
				/>

				<Textarea
					placeholder="Description (optional)"
					value={description}
					onChange={(e) => setDescription(e.currentTarget.value)}
					autosize
					minRows={2}
					maxRows={4}
				/>

				<Stack gap="xs">
					<Text size="xs" c="dimmed">Colour</Text>
					<Group gap="xs">
						{PRESET_COLORS.map((c) => (
							<ColorSwatch
								key={c}
								color={`var(--mantine-color-${c}-6)`}
								size={24}
								style={{
									cursor: 'pointer',
									outline: color === c ? '2px solid white' : 'none',
									outlineOffset: 2,
								}}
								onClick={() => setColor(color === c ? null : c)}
							/>
						))}
					</Group>
				</Stack>

				<Stack gap="xs" mt="auto">
					<Button
						fullWidth
						onClick={handleSubmit}
						disabled={!name.trim() || isPending}
						loading={isPending}
					>
						{isEdit ? 'Save changes' : 'Create list'}
					</Button>
					<Button fullWidth variant="outline" color="red" onClick={handleClose}>
						Cancel
					</Button>
				</Stack>
			</Stack>
		</Drawer>
	)
}
