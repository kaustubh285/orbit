import { useState } from 'react'
import {
	Badge, Button, Card, Group, Loader, Modal, ScrollArea,
	Stack, Text, ThemeIcon,
} from '@mantine/core'
import {
	IconCalendarEvent, IconCheck, IconFileText,
	IconRefresh, IconSquareCheck,
} from '@tabler/icons-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { getQuestsQueryKey, postQuestsMutation } from '@orbit/client'
import type { PostQuestsVoiceResponse } from '@orbit/client'
import dayjs from 'dayjs'

type VoiceQuest = PostQuestsVoiceResponse['quests'][number]

const TYPE_CONFIG = {
	todo: { Icon: IconSquareCheck, color: 'blue', label: 'Todo' },
	note: { Icon: IconFileText, color: 'gray', label: 'Note' },
	event: { Icon: IconCalendarEvent, color: 'pink', label: 'Event' },
	daily: { Icon: IconRefresh, color: 'teal', label: 'Daily' },
} as const

const PRIORITY_COLOR: Record<string, string> = {
	urgent: 'red',
	important: 'orange',
	quick_win: 'green',
	deep_work: 'blue',
	waiting: 'yellow',
	someday: 'gray',
}

function QuestCard({ quest }: { quest: VoiceQuest }) {
	const config = TYPE_CONFIG[quest.type]
	const dateStr = quest.dueAt ?? quest.startAt
	return (
		<Card withBorder radius="md" p="sm">
			<Group align="flex-start" gap="sm" wrap="nowrap">
				<ThemeIcon color={config.color} variant="light" radius="sm" size="md" style={{ flexShrink: 0, marginTop: 2 }}>
					<config.Icon size={14} />
				</ThemeIcon>
				<Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
					<Text fw={500} size="sm" style={{ wordBreak: 'break-word' }}>
						{quest.title}
					</Text>
					<Group gap={6} wrap="wrap">
						<Badge size="xs" variant="light" color={config.color}>
							{config.label}
						</Badge>
						{quest.priority && (
							<Badge size="xs" variant="dot" color={PRIORITY_COLOR[quest.priority] ?? 'gray'}>
								{quest.priority.replace('_', ' ')}
							</Badge>
						)}
						{dateStr && (
							<Text size="xs" c="dimmed">
								{dayjs(dateStr).format('MMM D, h:mm A')}
							</Text>
						)}
						{quest.location && (
							<Text size="xs" c="dimmed">
								{quest.location}
							</Text>
						)}
					</Group>
				</Stack>
			</Group>
		</Card>
	)
}

type Props = {
	opened: boolean
	result: PostQuestsVoiceResponse | null
	onClose: () => void
}

export function VoiceQuestModal({ opened, result, onClose }: Props) {
	const queryClient = useQueryClient()
	const [confirmed, setConfirmed] = useState(false)

	const createQuest = useMutation({
		...postQuestsMutation(),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: getQuestsQueryKey() }),
	})

	async function handleConfirm() {
		if (!result?.quests.length) { onClose(); return }
		setConfirmed(true)
		try {
			await Promise.all(
				result.quests.map((q) =>
					createQuest.mutateAsync({
						body: {
							type: q.type,
							title: q.title,
							...(q.body ? { body: q.body } : {}),
							...(q.dueAt ? { dueAt: q.dueAt } : {}),
							...(q.startAt ? { startAt: q.startAt } : {}),
							...(q.endAt ? { endAt: q.endAt } : {}),
							...(q.location ? { location: q.location } : {}),
							...(q.priority ? { priority: q.priority } : {}),
						},
					} as Parameters<typeof createQuest.mutate>[0]),
				),
			)
			onClose()
		} finally {
			setConfirmed(false)
		}
	}

	const hasQuests = (result?.quests.length ?? 0) > 0

	return (
		<Modal
			opened={opened}
			onClose={onClose}
			title="Voice note"
			size="md"
			radius="md"
			centered
		>
			<Stack gap="md">
				{result?.transcript && (
					<Stack gap={4}>
						<Text size="xs" c="dimmed" tt="uppercase" fw={600}>
							Transcription
						</Text>
						<Text size="sm" c="dimmed" style={{ fontStyle: 'italic' }}>
							"{result.transcript}"
						</Text>
					</Stack>
				)}

				{hasQuests ? (
					<Stack gap={4}>
						<Text size="xs" c="dimmed" tt="uppercase" fw={600}>
							{result!.quests.length === 1 ? '1 quest detected' : `${result!.quests.length} quests detected`}
						</Text>
						<ScrollArea.Autosize mah={320}>
							<Stack gap="xs">
								{result!.quests.map((q, i) => (
									<QuestCard key={i} quest={q} />
								))}
							</Stack>
						</ScrollArea.Autosize>
					</Stack>
				) : (
					<Text size="sm" c="dimmed" ta="center" py="md">
						No tasks detected in this recording.
					</Text>
				)}

				<Group justify="flex-end" gap="sm">
					<Button variant="subtle" color="gray" onClick={onClose}>
						Cancel
					</Button>
					{hasQuests && (
						<Button
							leftSection={confirmed ? <Loader size={14} color="white" /> : <IconCheck size={14} />}
							onClick={handleConfirm}
							disabled={confirmed}
						>
							{result!.quests.length === 1 ? 'Add quest' : `Add ${result!.quests.length} quests`}
						</Button>
					)}
				</Group>
			</Stack>
		</Modal>
	)
}
