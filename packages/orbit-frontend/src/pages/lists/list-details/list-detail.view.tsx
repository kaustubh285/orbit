import type { GetListsByIdResponse } from '@orbit/client'
import {
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

type ListWithItems = Extract<GetListsByIdResponse, { items: unknown[] }>

function SectionHeader({ label, count, accent }: { label: string; count: number; accent: string }) {
	return (
		<Group gap={8} align="center">
			<Box style={{ width: 3, height: 14, borderRadius: 2, background: accent, flexShrink: 0 }} />
			<Text size="xs" c="dimmed" fw={600} tt="uppercase" style={{ letterSpacing: '0.05em' }}>
				{label} ({count})
			</Text>
		</Group>
	)
}

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
				<Box
					style={{
						borderRadius: 12,
						background: 'var(--mantine-color-dark-6)',
						padding: '24px 20px 20px',
					}}
				>
					<Stack gap="xs">
						<Skeleton height={48} width={48} radius="md" />
						<Skeleton height={22} width="40%" mt={8} />
						<Skeleton height={14} width="60%" />
					</Stack>
				</Box>
			) : list ? (
				<Box
					style={{
						borderRadius: 12,
						position: 'relative',
						background: `linear-gradient(135deg, color-mix(in srgb, ${accent} 18%, var(--mantine-color-dark-7)) 0%, var(--mantine-color-dark-7) 70%)`,
						border: `1px solid color-mix(in srgb, ${accent} 30%, var(--mantine-color-dark-4))`,
						padding: '24px 20px 20px',
					}}
				>
					<Group gap="md" align="flex-start" wrap="nowrap">
						<Box
							style={{
								width: 52,
								height: 52,
								borderRadius: 12,
								background: `color-mix(in srgb, ${accent} 20%, var(--mantine-color-dark-5))`,
								border: `1px solid color-mix(in srgb, ${accent} 35%, transparent)`,
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								fontSize: 26,
								flexShrink: 0,
							}}
						>
							{list.icon}
						</Box>
						<Stack gap={4} style={{ flex: 1 }}>
							<Text fw={700} size="lg" lh={1.2}>{list.name}</Text>
							{list.description && (
								<Text size="sm" c="dimmed">{list.description}</Text>
							)}
						</Stack>
						<Tooltip label="Edit list" withArrow>
							<ActionIcon variant="subtle" color="gray" size="sm" style={{ flexShrink: 0 }} onClick={() => setEditOpen(true)}>
								<IconEdit size={15} />
							</ActionIcon>
						</Tooltip>
					</Group>
				</Box>
			) : (
				<Text c="dimmed">List not found.</Text>
			)}

			{list && (
				<Stack gap="xl">
					<Stack gap="sm">
						<SectionHeader label="Saves" count={saveItems.length} accent={accent} />
						<SavesView
							saves={saveItems.map((i) => i.save as Save)}
							isLoading={false}
						/>
					</Stack>

					<Stack gap="xs">
						<SectionHeader label="Quests" count={questItems.length} accent={accent} />
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
					</Stack>
				</Stack>
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
