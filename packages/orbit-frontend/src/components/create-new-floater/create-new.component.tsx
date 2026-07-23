import { useEffect, useState } from 'react'
import {
	ActionIcon, Alert, Button, Chip, Drawer, Group,
	MultiSelect, Stack, Switch, Text, Textarea, TextInput,
} from '@mantine/core'
import { DateTimePicker } from '@mantine/dates'
import {
	IconBookmark, IconCalendarEvent, IconClipboardCheckFilled, IconFileText,
	IconPackageImport,
	IconRefresh, IconSparkles, IconSquareCheck,
} from '@tabler/icons-react'
import { useNavigate, useParams } from '@tanstack/react-router'
import dayjs from 'dayjs'
import { useCreateNew, type UiType, type QuestFields } from './use-create-new.hook'
import ROUTES from '@/routes'
import { useOrbitAppStore } from '@/store/orbit-app.store'
import { useMediaQuery } from '@mantine/hooks'
import { Picker, type PickerProps } from '@gfazioli/mantine-picker';

// ─── Constants ───────────────────────────────────────────────────────────────

const REMEMBRAL_EMOJIS = ['🍞', '🚀', '✈️', '🎵', '🏃', '📚', '🎉', '❤️', '🍕', '⚽', '🎬', '🌟', '☺️', '😛', '🤮', '😭', '✅']

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

function SaveFields({
	note, onNoteChange, shouldAISummaries, onShouldAISummariesChange,
}: {
	note: string
	onNoteChange: (v: string) => void
	shouldAISummaries: boolean
	onShouldAISummariesChange: (v: boolean) => void
}) {
	return (
		<Stack gap="sm">
			<Textarea
				placeholder="Why are you saving this? (optional)"
				value={note}
				onChange={(e) => onNoteChange(e.currentTarget.value)}
				autosize
				minRows={2}
				maxRows={4}
			/>
			<Switch
				label="Enable AI summary"
				checked={shouldAISummaries}
				onChange={(e) => onShouldAISummariesChange(e.currentTarget.checked)}
			/>
		</Stack>
	)
}

// ─── Main component ───────────────────────────────────────────────────────────

const EMPTY_FIELDS: QuestFields = {
	dueAt: null, startAt: null, endAt: null, location: '', emoji: null,
}

export function CreateNewComponent() {
	const opened = useOrbitAppStore((s) => s.createNewOpen)
	const setOpened = useOrbitAppStore((s) => s.actions.setCreateNewOpen)
	const [title, setTitle] = useState('')
	const [uiTypeOverride, setUiTypeOverride] = useState<UiType | null>(null)
	const [fields, setFields] = useState<QuestFields>(EMPTY_FIELDS)
	const [saveNote, setSaveNote] = useState('')
	const [shouldAISummaries, setShouldAISummaries] = useState(true)
	const [listIds, setListIds] = useState<string[]>([])

	const { lists, onSubmit, isPending, refetchLists, isRefetchingLists, duplicateNotice, clearDuplicateNotice } = useCreateNew()
	const navigate = useNavigate()
	const isDesktop = useMediaQuery("(min-width: 48em)", false, { getInitialValueInEffect: false })

	const params = useParams({ strict: false })
	const id = 'id' in params ? params.id : undefined

	useEffect(() => {
		if (id) setListIds([id])
	}, [id])

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
		setShouldAISummaries(false)
		setListIds([])
	}

	function handleClose() {
		setOpened(false)
		reset()
		clearDuplicateNotice()
	}

	function handleTypeChange(t: UiType) {
		setUiTypeOverride(t)
		// Reset date fields when switching away from memory to avoid stale state
		if (t !== 'memory') patchFields({ startAt: null, emoji: null })
		if (t !== 'todo') patchFields({ dueAt: null })
		if (t !== 'event') patchFields({ endAt: null, location: '' })
	}

	async function handleSubmit() {
		const result = await onSubmit(effectiveType, title, fields, saveNote, listIds, shouldAISummaries)
		if (!duplicateNotice)
			handleClose()
		if (result?.id && effectiveType === 'note') {
			navigate({ to: ROUTES.NOTE_DETAIL, params: { noteId: result.id } })
		}
	}

	const submitLabel = effectiveType === 'save' ? 'Save bookmark'
		: effectiveType === 'memory' ? 'Add memory'
			: effectiveType === 'note' ? 'Create note'
				: 'Add quest'

	const importFromClipboard = () => {
		navigator.clipboard.readText().then((text) => {
			setTitle(text)
		})
	}
	return (
		<>
			<Drawer
				position={isDesktop ? "left" : "bottom"}
				size={isDesktop ? "md" : "85%"}
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
						<Group w={"100%"}>
							< TextInput
								flex={1}
								placeholder="Type something or paste a URL…"
								value={title}
								onChange={(e) => setTitle(e.currentTarget.value)}
								autoFocus
								onKeyDown={(e) => {
									if (e.key === 'Enter' && effectiveType !== 'note') handleSubmit()
								}}
							/>
							<ActionIcon>
								<IconClipboardCheckFilled height={20} onClick={importFromClipboard} />
							</ActionIcon>
						</Group>

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
						{title && effectiveType === 'save' && (
							<SaveFields
								note={saveNote}
								onNoteChange={setSaveNote}
								shouldAISummaries={shouldAISummaries}
								onShouldAISummariesChange={setShouldAISummaries}
							/>
						)}
						{title && effectiveType === 'note' && <Text size="xs" c="dimmed">Opens in the note editor after creating.</Text>}


						{title && lists.length > 0 && (
							<Stack gap={4}>
								<Group justify="space-between">
									<Text size="xs" c="dimmed">Add to lists (optional)</Text>
									<Button variant="subtle" color="gray" size="xs" leftSection={<IconRefresh size={13} />} onClick={() => refetchLists()} loading={isRefetchingLists}>
										Re-fetch lists
									</Button>
								</Group>
								<MultiSelect
								searchable
									placeholder="Add to one or more lists…"
									value={listIds}
									onChange={setListIds}
									clearable
									data={lists.map((l) => ({ value: l.id, label: l.name }))}
									comboboxProps={{ withinPortal: false }}
								/>
							</Stack>
						)}



					</Stack>

					{duplicateNotice && (
						<Alert color="yellow" withCloseButton onClose={clearDuplicateNotice}>
							You saved this on {new Date(duplicateNotice).toLocaleDateString()} — that&apos;s twice now. Maybe it matters?
						</Alert>
					)}

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
