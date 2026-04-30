import { useState } from 'react'
import {
	ActionIcon, Button, Chip, Drawer, Group,
	Stack, Text, Textarea, TextInput,
} from '@mantine/core'
import { DateTimePicker } from '@mantine/dates'
import { IconBookmark, IconChecklist, IconPlus } from '@tabler/icons-react'
import { TYPE_COLOR, TYPE_ICON } from '@/CONSTANTS'
import type { Quest } from '@/types'
import { useCreateNew } from './use-create-new.hook'

const QUEST_TYPES: Quest["type"][] = ['todo', 'note', 'event', 'daily']

function looksLikeUrl(value: string): boolean {
	const v = value.trim()
	if (!v) return false
	if (/^https?:\/\//i.test(v)) return true
	if (/^www\./i.test(v)) return true
	// bare domain with no spaces: "github.com/...", "youtube.com/..."
	if (!v.includes(' ') && /^[^\s.]+\.[a-z]{2,}/i.test(v)) return true
	return false
}

function getDrawerSize(title: string, mode: 'quest' | 'save', questType: Quest["type"]): string {
	if (!title) return '35%'
	if (mode === 'save') return 'sm'
	if (questType === 'event') return 'lg'
	if (questType === 'note') return 'md'
	return 'sm'
}

export function CreateNewComponent() {
	const [opened, setOpened] = useState(false)
	const [title, setTitle] = useState('')

	// quest-specific state
	const [questType, setQuestType] = useState<Quest["type"]>('todo')
	const [dueAt, setDueAt] = useState<string | null>(null)
	const [body, setBody] = useState('')
	const [startAt, setStartAt] = useState<string | null>(null)
	const [endAt, setEndAt] = useState<string | null>(null)
	const [location, setLocation] = useState('')

	// save-specific state
	const [saveNote, setSaveNote] = useState('')

	const [modeOverride, setModeOverride] = useState<'quest' | 'save' | null>(null)

	const { onHandleSubmit, isPending } = useCreateNew()

	const mode = modeOverride ?? (looksLikeUrl(title) ? 'save' : 'quest')

	function reset() {
		setTitle('')
		setQuestType('todo')
		setDueAt(null)
		setBody('')
		setStartAt(null)
		setEndAt(null)
		setLocation('')
		setSaveNote('')
		setModeOverride(null)
	}

	function handleClose() {
		setOpened(false)
		reset()
	}

	function handleSubmit() {
		onHandleSubmit(mode, title, questType, { dueAt, body, startAt, endAt, location }, saveNote)
		handleClose()
	}

	return (
		<>
			<ActionIcon
				size="xl"
				radius="xl"
				variant="filled"
				style={{ position: 'fixed', bottom: 80, right: 24, zIndex: 200 }}
				onClick={() => setOpened(true)}
				aria-label="Create new"
			>
				<IconPlus size={20} />
			</ActionIcon>

			<Drawer
				position="bottom"
				size={getDrawerSize(title, mode, questType)}
				opened={opened}
				onClose={handleClose}
				title="Create new"
				styles={{
					content: { display: 'flex', flexDirection: 'column' },
					body: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' },
				}}
			>
				<Stack gap="md" justify="space-between" h="100%">
					<Stack gap="md">
							{title && mode === 'save' && (
								<Group justify="space-between">
									<Group gap="xs">
										<IconBookmark size={14} />
										<Text size="sm" c="dimmed">Saving as bookmark</Text>
									</Group>
									<Chip
										variant="filled"
										color="gray"
										size="xs"
										onClick={() => setModeOverride('quest')}
									>
										<Group gap={4} wrap="nowrap">
											<IconChecklist size={12} />
											Quest instead
										</Group>
									</Chip>
								</Group>
							)}

							<TextInput
								placeholder="Type a quest or paste a URL…"
								value={title}
								onChange={(e) => setTitle(e.currentTarget.value)}
								autoFocus
								onKeyDown={(e) => {
									if (e.key === 'Enter' && questType !== 'note') handleSubmit()
								}}
							/>

							{title && mode === 'quest' && (
								<>
									<Chip.Group
										value={questType}
										onChange={(v) => setQuestType(v as Quest["type"])}
									>
										<Group gap="xs">
											{QUEST_TYPES.map((t) => {
												const Icon = TYPE_ICON[t]
												return (
													<Chip
														key={t}
														value={t}
														color={TYPE_COLOR[t]}
														size="sm"
														variant="light"
													>
														<Group gap={4} wrap="nowrap">
															<Icon size={12} />
															{t}
														</Group>
													</Chip>
												)
											})}
											<Chip
												onClick={() => setModeOverride('save')}
												color="yellow"
												size="sm"
												variant="light"
											>
												<Group gap={4} wrap="nowrap">
													<IconBookmark size={12} />
													Save instead
												</Group>
											</Chip>
										</Group>
									</Chip.Group>

									{questType === 'todo' && (
										<DateTimePicker
											placeholder="Due date (optional)"
											value={dueAt}
											onChange={setDueAt}
											clearable
										/>
									)}

									{questType === 'note' && (
										<Textarea
											placeholder="Note…"
											value={body}
											onChange={(e) => setBody(e.currentTarget.value)}
											autosize
											minRows={3}
											maxRows={8}
										/>
									)}

									{questType === 'event' && (
										<Stack gap="xs">
											<DateTimePicker
												placeholder="Starts at"
												value={startAt}
												onChange={setStartAt}
											/>
											<DateTimePicker
												placeholder="Ends at (optional)"
												value={endAt}
												onChange={setEndAt}
												clearable
											/>
											<TextInput
												placeholder="Location (optional)"
												value={location}
												onChange={(e) => setLocation(e.currentTarget.value)}
											/>
										</Stack>
									)}
								</>
							)}

							{title && mode === 'save' && (
								<Textarea
									placeholder="Why are you saving this? (optional)"
									value={saveNote}
									onChange={(e) => setSaveNote(e.currentTarget.value)}
									autosize
									minRows={2}
									maxRows={4}
								/>
							)}

					</Stack>
					<Stack gap="xs">
						<Button
							fullWidth
							onClick={handleSubmit}
							disabled={!title.trim() || isPending}
							loading={isPending}
						>
							{mode === 'save' ? 'Save' : 'Add quest'}
						</Button>
						<Button fullWidth variant="outline" color="red" onClick={handleClose}>
							Cancel
						</Button>
					</Stack>
				</Stack>
			</Drawer>
		</>
	)
}
