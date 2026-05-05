import { useState } from 'react'
import {
	ActionIcon, Button, Chip, Drawer, Group,
	Select, Stack, Text, Textarea, TextInput,
} from '@mantine/core'
import { DateTimePicker } from '@mantine/dates'
import {
	IconBookmark, IconCalendarEvent, IconFileText,
	IconPlus, IconRefresh, IconSparkles, IconSquareCheck,
} from '@tabler/icons-react'
import { useNavigate } from '@tanstack/react-router'
import dayjs from 'dayjs'
import { useCreateNew, type UiType, type QuestFields } from './use-create-new.hook'
import ROUTES from '@/routes'

// ─── Constants ───────────────────────────────────────────────────────────────

const REMEMBRAL_EMOJIS = ['🍞', '🚀', '✈️', '🎵', '🏃', '📚', '🎉', '❤️', '🍕', '⚽', '🎬', '🌟']

const QUICK_DATES = [
	{ label: 'Today', iso: () => dayjs().startOf('day').toISOString() },
	{ label: 'Yesterday', iso: () => dayjs().subtract(1, 'day').startOf('day').toISOString() },
	{ label: 'Last week', iso: () => dayjs().subtract(7, 'day').startOf('day').toISOString() },
]

const TYPE_OPTIONS: { type: UiType; label: string; Icon: React.ElementType; color: string }[] = [
	{ type: 'todo', label: 'Todo', Icon: IconSquareCheck, color: 'blue' },
	{ type: 'note', label: 'Note', Icon: IconFileText, color: 'gray' },
	{ type: 'event', label: 'Event', Icon: IconCalendarEvent, color: 'pink' },
	{ type: 'memory', label: 'Memory', Icon: IconSparkles, color: 'violet' },
	{ type: 'daily', label: 'Daily', Icon: IconRefresh, color: 'teal' },
	{ type: 'save', label: 'Bookmark', Icon: IconBookmark, color: 'yellow' },
]

function looksLikeUrl(value: string): boolean {
	const v = value.trim()
	if (!v) return false
	if (/^https?:\/\//i.test(v)) return true
	if (/^www\./i.test(v)) return true
	if (!v.includes(' ') && /^[^\s.]+\.[a-z]{2,}/i.test(v)) return true
	return false
}


// ─── Field sub-components ────────────────────────────────────────────────────

function TodoFields({ value, onChange }: { value: string | null; onChange: (v: string | null) => void }) {
	return (
		<DateTimePicker
			placeholder="Due date (optional)"
			value={value}
			onChange={onChange}
			clearable
		/>
	)
}

function EventFields({ fields, onChange }: {
	fields: Pick<QuestFields, 'startAt' | 'endAt' | 'location'>
	onChange: (patch: Partial<QuestFields>) => void
}) {
	return (
		<Stack gap="xs">
			<DateTimePicker
				placeholder="Starts at"
				value={fields.startAt}
				onChange={(v) => onChange({ startAt: v })}
			/>
			<DateTimePicker
				placeholder="Ends at (optional)"
				value={fields.endAt}
				onChange={(v) => onChange({ endAt: v })}
				clearable
			/>
			<TextInput
				placeholder="Location (optional)"
				value={fields.location}
				onChange={(e) => onChange({ location: e.currentTarget.value })}
			/>
		</Stack>
	)
}

function MemoryFields({ fields, onChange }: {
	fields: Pick<QuestFields, 'startAt' | 'emoji'>
	onChange: (patch: Partial<QuestFields>) => void
}) {
	return (
		<Stack gap="xs">
			<Group gap="xs">
				{QUICK_DATES.map(({ label, iso }) => {
					const isoVal = iso()
					return (
						<Chip
							key={label}
							checked={fields.startAt === isoVal}
							onChange={() => onChange({ startAt: fields.startAt === isoVal ? null : isoVal })}
							size="sm"
							variant="light"
							color="violet"
						>
							{label}
						</Chip>
					)
				})}
			</Group>
			<DateTimePicker
				placeholder="Or pick a date…"
				value={fields.startAt}
				onChange={(v) => onChange({ startAt: v })}
				maxDate={new Date()}
			/>
			<Text size="xs" c="dimmed">Emoji (optional)</Text>
			<Group gap={6}>
				{REMEMBRAL_EMOJIS.map((e) => (
					<ActionIcon
						key={e}
						variant={fields.emoji === e ? 'filled' : 'subtle'}
						size="lg"
						radius="xl"
						onClick={() => onChange({ emoji: fields.emoji === e ? null : e })}
						style={{ fontSize: 18 }}
					>
						{e}
					</ActionIcon>
				))}
			</Group>
		</Stack>
	)
}

function SaveFields({ value, onChange }: { value: string; onChange: (v: string) => void }) {
	return (
		<Textarea
			placeholder="Why are you saving this? (optional)"
			value={value}
			onChange={(e) => onChange(e.currentTarget.value)}
			autosize
			minRows={2}
			maxRows={4}
		/>
	)
}

// ─── Main component ───────────────────────────────────────────────────────────

const EMPTY_FIELDS: QuestFields = {
	dueAt: null, startAt: null, endAt: null, location: '', emoji: null,
}

export function CreateNewComponent() {
	const [opened, setOpened] = useState(false)
	const [title, setTitle] = useState('')
	const [uiTypeOverride, setUiTypeOverride] = useState<UiType | null>(null)
	const [fields, setFields] = useState<QuestFields>(EMPTY_FIELDS)
	const [saveNote, setSaveNote] = useState('')
	const [listId, setListId] = useState<string | null>(null)

	const { lists, onSubmit, isPending } = useCreateNew()
	const navigate = useNavigate()

	// Auto-detect save mode from URL; user can override with a chip tap
	const effectiveType: UiType = uiTypeOverride ?? (looksLikeUrl(title) ? 'save' : 'todo')

	function patchFields(patch: Partial<QuestFields>) {
		setFields((prev) => ({ ...prev, ...patch }))
	}

	function reset() {
		setTitle('')
		setUiTypeOverride(null)
		setFields(EMPTY_FIELDS)
		setSaveNote('')
		setListId(null)
	}

	function handleClose() {
		setOpened(false)
		reset()
	}

	function handleTypeChange(t: UiType) {
		setUiTypeOverride(t)
		// Reset date fields when switching away from memory to avoid stale state
		if (t !== 'memory') patchFields({ startAt: null, emoji: null })
		if (t !== 'todo') patchFields({ dueAt: null })
		if (t !== 'event') patchFields({ endAt: null, location: '' })
	}

	async function handleSubmit() {
		const result = await onSubmit(effectiveType, title, fields, saveNote, listId ?? undefined)
		handleClose()
		if (result?.id && effectiveType === 'note') {
			navigate({ to: ROUTES.NOTE_DETAIL, params: { noteId: result.id } })
		}
	}

	const submitLabel = effectiveType === 'save' ? 'Save bookmark'
		: effectiveType === 'memory' ? 'Add memory'
			: effectiveType === 'note' ? 'Create note'
				: 'Add quest'

	return (
		<>
			<ActionIcon
				size="xl"
				radius="xl"
				variant="filled"
				style={{ position: 'fixed', bottom: 'calc(64px + env(safe-area-inset-bottom) + 16px)', right: 24, zIndex: 200 }}
				onClick={() => setOpened(true)}
				aria-label="Create new"
			>
				<IconPlus size={20} />
			</ActionIcon>

			<Drawer
				position="bottom"
				size="85%"
				opened={opened}
				onClose={handleClose}
				title="New"
				styles={{
					content: { display: 'flex', flexDirection: 'column' },
					body: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' },
				}}
			>
				<Stack gap="md" justify="space-between" h="100%">
					<Stack gap="md">
						<TextInput
							placeholder="Type something or paste a URL…"
							value={title}
							onChange={(e) => setTitle(e.currentTarget.value)}
							autoFocus
							onKeyDown={(e) => {
								if (e.key === 'Enter' && effectiveType !== 'note') handleSubmit()
							}}
						/>

						{title && (
							<Chip.Group value={effectiveType} onChange={(v) => handleTypeChange(v as UiType)}>
								<Group gap="xs">
									{TYPE_OPTIONS.map(({ type, label, Icon, color }) => (
										<Chip key={type} value={type} color={color} size="sm" variant="light">
											<Group gap={4} wrap="nowrap">
												<Icon size={12} />
												{label}
											</Group>
										</Chip>
									))}
								</Group>
							</Chip.Group>
						)}

						{title && effectiveType === 'todo' && <TodoFields value={fields.dueAt} onChange={(v) => patchFields({ dueAt: v })} />}
						{title && effectiveType === 'event' && <EventFields fields={fields} onChange={patchFields} />}
						{title && effectiveType === 'memory' && <MemoryFields fields={fields} onChange={patchFields} />}
						{title && effectiveType === 'save' && <SaveFields value={saveNote} onChange={setSaveNote} />}
						{title && effectiveType === 'note' && <Text size="xs" c="dimmed">Opens in the note editor after creating.</Text>}

						{title && lists.length > 0 && (
							<Select
								placeholder="Add to a list (optional)"
								value={listId}
								onChange={setListId}
								clearable
								data={lists.map((l) => ({ value: l.id, label: l.name }))}
							/>
						)}
					</Stack>

					<Stack gap="xs">
						<Button fullWidth onClick={handleSubmit} disabled={!title.trim() || isPending} loading={isPending}>
							{submitLabel}
						</Button>
						<Button fullWidth variant="subtle" color="gray" onClick={handleClose}>
							Cancel
						</Button>
					</Stack>
				</Stack>
			</Drawer>
		</>
	)
}
