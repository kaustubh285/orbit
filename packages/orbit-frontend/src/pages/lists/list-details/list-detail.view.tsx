import type { GetListsByIdResponse } from '@orbit/client'
import {
	Accordion,
	ActionIcon,
	Box,
	Group,
	Skeleton,
	Stack,
	Text,
	Tooltip,
} from '@mantine/core'
import { Link } from '@tanstack/react-router'
import {
	IconArrowLeft,
	IconEdit,
	IconTrash,
} from '@tabler/icons-react'
import type { List, Quest, Save } from '@/types'
import { listAccentColor } from '../lists.utils'
import { ListFormDrawer } from '../list-form-drawer.component'
import { useState } from 'react'
import { QuestRow, NewQuestRow } from '@/components/quests/list-quests.component'
import SavesView from '@/pages/saves/saves.view'
import { PrivacyAwareText } from '@/components/privacy-aware-text.component'

type ListWithItems = Extract<GetListsByIdResponse, { items: unknown[] }>

export function ListDetailView({
	list,
	isLoading,
	onUpdate,
	onRemoveItem,
	submitQuest,
	toggleQuest,
	onOpenQuest,
	isUpdating,
}: {
	list: ListWithItems | undefined
	isLoading: boolean
	onUpdate: (name: string, description?: string, color?: string, icon?: string) => void
	onRemoveItem: (itemId: string) => void
	submitQuest: (title: string, type: Quest["type"]) => void
	toggleQuest: (quest: Quest) => void
	onOpenQuest: (quest: Quest) => void
	isUpdating: boolean
}) {
	const [editOpen, setEditOpen] = useState(false)
	const accent = listAccentColor(list?.color ?? null)

	const allItems = list?.items ?? []
	const saveItems = allItems.filter((i) => i.save)
	const questItems = allItems.filter((i) => i.quest)

	function handleEditSubmit(name: string, description?: string, color?: string, icon?: string) {
		onUpdate(name, description, color, icon)
		setEditOpen(false)
	}

	const editInitial: List | undefined = list
		? { id: list.id, userId: list.userId, name: list.name, description: list.description, color: list.color, icon: list.icon, createdAt: list.createdAt, updatedAt: list.updatedAt, recentSave: null }
		: undefined

	return (
		<Stack gap="md">
			<Group gap="xs">
				<ActionIcon component={Link} to="/lists" variant="subtle" color="gray" size="sm" aria-label="Back to lists">
					<IconArrowLeft size={16} />
				</ActionIcon>
				<Text size="xs" c="dimmed">Lists</Text>
			</Group>

			{isLoading ? (
				<Group gap="md" align="center">
					<Skeleton height={96} width={96} radius="xl" style={{ flexShrink: 0 }} />
					<Stack gap="xs" style={{ flex: 1 }}>
						<Skeleton height={22} width="50%" />
						<Skeleton height={14} width="70%" />
					</Stack>
				</Group>
			) : list ? (
				<Group gap="md" align="center" wrap="nowrap">
					<PrivacyAwareText
						style={{
							width: 96,
							height: 96,
							borderRadius: 20,
							background: accent,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							fontSize: 44,
							flexShrink: 0,
							boxShadow: `0 8px 24px color-mix(in srgb, ${accent} 40%, transparent)`,
						}}
					>
						{list.icon}
					</PrivacyAwareText>
					<Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
						<PrivacyAwareText fw={800} size="xl" lh={1.2}>{list.name}</PrivacyAwareText>
						{list.description && (
							<PrivacyAwareText size="sm" c="dimmed">{list.description}</PrivacyAwareText>
						)}
					</Stack>
					<Tooltip label="Edit list" withArrow>
						<ActionIcon variant="subtle" color="gray" size="sm" style={{ flexShrink: 0, alignSelf: 'flex-start' }} onClick={() => setEditOpen(true)}>
							<IconEdit size={15} />
						</ActionIcon>
					</Tooltip>
				</Group>
			) : (
				<Text c="dimmed">List not found.</Text>
			)}

			{list && (
				<Accordion
					multiple
					defaultValue={['saves', 'quests']}
					variant="separated"
					styles={{
						item: { border: '1px solid var(--mantine-color-dark-4)', borderRadius: 8 },
						control: { padding: '8px 10px' },
						label: { padding: 0 },
						content: { padding: '4px 8px 8px' },
					}}
				>
					<Accordion.Item value="saves">
						<Accordion.Control>
							<Group gap={8} align="center">
								<Box style={{ width: 3, height: 14, borderRadius: 2, background: accent, flexShrink: 0 }} />
								<Text size="xs" fw={600} tt="uppercase" c="dimmed" style={{ letterSpacing: '0.05em' }}>
									Saves ({saveItems.length})
								</Text>
							</Group>
						</Accordion.Control>
						<Accordion.Panel>
							<SavesView
								saves={saveItems.map((i) => i.save as Save)}
								isLoading={false}
							/>
						</Accordion.Panel>
					</Accordion.Item>

					<Accordion.Item value="quests">
						<Accordion.Control>
							<Group gap={8} align="center">
								<Box style={{ width: 3, height: 14, borderRadius: 2, background: accent, flexShrink: 0 }} />
								<Text size="xs" fw={600} tt="uppercase" c="dimmed" style={{ letterSpacing: '0.05em' }}>
									Quests ({questItems.length})
								</Text>
							</Group>
						</Accordion.Control>
						<Accordion.Panel>
							<div style={{ borderBottom: '1px dotted var(--mantine-color-gray-4)' }}>
								{questItems.map((item) => (
									<Group key={item.id} wrap="nowrap" gap={0}>
										<div style={{ flex: 1, minWidth: 0 }}>
											<QuestRow
												quest={item.quest as Quest}
												onToggle={toggleQuest}
												onOpen={onOpenQuest}
											/>
										</div>
										<Tooltip label="Remove from list" withArrow>
											<ActionIcon
												variant="subtle"
												color="gray"
												size="sm"
												style={{ flexShrink: 0, marginRight: 4 }}
												onClick={() => onRemoveItem(item.id)}
											>
												<IconTrash size={13} />
											</ActionIcon>
										</Tooltip>
									</Group>
								))}
								<NewQuestRow onSubmit={submitQuest} />
							</div>
						</Accordion.Panel>
					</Accordion.Item>
				</Accordion>
			)}

			{editInitial && (
				<ListFormDrawer
					key={editOpen ? 'open' : 'closed'}
					opened={editOpen}
					onClose={() => setEditOpen(false)}
					onSubmit={handleEditSubmit}
					isPending={isUpdating}
					initial={editInitial}
				/>
			)}
		</Stack>
	)
}
