import type { List } from '@/types'
import { ActionIcon, Button, ColorInput, Drawer, Group, Stack, Switch, Text, Textarea, TextInput } from '@mantine/core'
import { useState } from 'react'

// Hex equivalents of Mantine default theme shade-6 for each preset color
const COLOR_SWATCHES = [
	'#fa5252', '#fd7e14', '#fab005', '#40c057', '#12b886',
	'#228be6', '#4c6ef5', '#7950f2', '#be4bdb', '#e64980',
]

const ICON_OPTIONS = [
	'📋', '📁', '📂', '🗂️', '📌', '📍', '🔖', '⭐', '❤️', '🎯',
	'🚀', '💡', '🛒', '🎬', '📚', '🎵', '💪', '🏠', '✈️', '🌱',
	'💼', '🎮', '🍕', '📷', '🧠', '🔥', '💰', '🎁', '🌍', '⚡',
]

export const DEFAULT_LIST_ICON = '📋'

export function ListFormDrawer({
	opened,
	onClose,
	onSubmit,
	isPending,
	initial,
}: {
	opened: boolean
	onClose: () => void
	onSubmit: (name: string, description?: string, color?: string, icon?: string, includeInResurface?: boolean) => void
	isPending: boolean
	initial?: Pick<List, 'name' | 'description' | 'color' | 'icon' | 'includeInResurface'>
}) {
	const [name, setName] = useState(initial?.name ?? '')
	const [description, setDescription] = useState(initial?.description ?? '')
	const [color, setColor] = useState(initial?.color ?? '')
	const [icon, setIcon] = useState(initial?.icon ?? DEFAULT_LIST_ICON)
	const [includeInResurface, setIncludeInResurface] = useState(initial?.includeInResurface ?? false)

	const isEdit = !!initial

	function handleClose() {
		onClose()
	}

	function handleSubmit() {
		if (!name.trim()) return
		onSubmit(name.trim(), description.trim() || undefined, color || undefined, icon, includeInResurface)
		handleClose()
	}

	return (
		<Drawer
			position="bottom"
			size="lg"
			opened={opened}
			onClose={handleClose}
			title={isEdit ? 'Edit list' : 'New list'}
			styles={{
				content: { display: 'flex', flexDirection: 'column' },
				body: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' },
			}}
		>
			<Stack gap="md" h="100%">
				<Group gap="sm" align="flex-start">
					<Text
						style={{
							fontSize: 40,
							lineHeight: 1,
							cursor: 'default',
							userSelect: 'none',
						}}
					>
						{icon}
					</Text>
					<TextInput
						placeholder="List name…"
						value={name}
						onChange={(e) => setName(e.currentTarget.value)}
						autoFocus
						onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit() }}
						style={{ flex: 1 }}
					/>
				</Group>

				<Stack gap="xs">
					<Text size="xs" c="dimmed">Icon</Text>
					<Group gap={6} wrap="wrap">
						{ICON_OPTIONS.map((e) => (
							<ActionIcon
								key={e}
								variant={icon === e ? 'filled' : 'subtle'}
								size="lg"
								radius="md"
								onClick={() => setIcon(e)}
								style={{ fontSize: 18 }}
							>
								{e}
							</ActionIcon>
						))}
					</Group>
				</Stack>

				<Textarea
					placeholder="Description (optional)"
					value={description}
					onChange={(e) => setDescription(e.currentTarget.value)}
					autosize
					minRows={2}
					maxRows={4}
				/>

				<ColorInput
					label="Colour"
					placeholder="Pick or enter a colour"
					value={color}
					onChange={setColor}
					format="hex"
					swatches={COLOR_SWATCHES}
					swatchesPerRow={10}
					closeOnColorSwatchClick
				/>

				<Switch
					label="Include in Resurface"
					description="Saves from this list may bubble back up on your Resurface page"
					checked={includeInResurface}
					onChange={(e) => setIncludeInResurface(e.currentTarget.checked)}
				/>

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
