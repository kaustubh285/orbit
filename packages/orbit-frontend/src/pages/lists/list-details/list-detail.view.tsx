import type { GetListsByIdResponse } from '@orbit/client'
import {
	ActionIcon,
	Anchor,
	Badge,
	Box,
	Group,
	Skeleton,
	Stack,
	Text,
	TextInput,
	Tooltip,
} from '@mantine/core'
import { Link } from '@tanstack/react-router'
import {
	IconArrowLeft,
	IconEdit,
	IconExternalLink,
	IconSearch,
	IconTrash,
} from '@tabler/icons-react'
import type { List } from '@/types'
import { listAccentColor } from '../lists.utils'
import { ListFormDrawer } from '../list-form-drawer.component'
import { useState } from 'react'

type ListWithItems = Extract<GetListsByIdResponse, { items: unknown[] }>
type ListItem = ListWithItems['items'][number]

const QUEST_TYPE_LABELS: Record<string, string> = {
	todo: 'To-do',
	note: 'Note',
	event: 'Event',
	daily: 'Daily',
}

const PLATFORM_LABELS: Record<string, string> = {
	youtube: 'YouTube',
	reddit: 'Reddit',
	instagram: 'Instagram',
	web: 'Web',
}

function QuestItem({ item, onRemove }: { item: ListItem; onRemove: () => void }) {
	const quest = item.quest!
	return (
		<Group
			wrap="nowrap"
			justify="space-between"
			style={{
				padding: '8px 12px',
				borderRadius: 6,
				background: 'var(--mantine-color-dark-6)',
				border: '1px solid var(--mantine-color-dark-4)',
			}}
		>
			<Group gap="xs" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
				<Badge size="xs" variant="light" color="blue">
					{QUEST_TYPE_LABELS[quest.type] ?? quest.type}
				</Badge>
				<Text size="sm" truncate style={{ flex: 1 }}>
					{quest.title}
				</Text>
				{quest.status === 'completed' && (
					<Badge size="xs" variant="dot" color="green">Done</Badge>
				)}
			</Group>
			<Tooltip label="Remove from list" withArrow>
				<ActionIcon variant="subtle" color="gray" size="sm" onClick={onRemove}>
					<IconTrash size={13} />
				</ActionIcon>
			</Tooltip>
		</Group>
	)
}

function SaveItem({ item, onRemove }: { item: ListItem; onRemove: () => void }) {
	const save = item.save!
	return (
		<Group
			wrap="nowrap"
			justify="space-between"
			style={{
				padding: '8px 12px',
				borderRadius: 6,
				background: 'var(--mantine-color-dark-6)',
				border: '1px solid var(--mantine-color-dark-4)',
			}}
		>
			<Group gap="xs" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
				<Badge size="xs" variant="light" color="grape">
					{PLATFORM_LABELS[save.sourcePlatform] ?? save.sourcePlatform}
				</Badge>
				<Text size="sm" truncate style={{ flex: 1 }}>
					{save.title ?? save.sourceUrl}
				</Text>
				<Anchor href={save.sourceUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
					<IconExternalLink size={13} color="var(--mantine-color-dimmed)" />
				</Anchor>
			</Group>
			<Tooltip label="Remove from list" withArrow>
				<ActionIcon variant="subtle" color="gray" size="sm" onClick={onRemove}>
					<IconTrash size={13} />
				</ActionIcon>
			</Tooltip>
		</Group>
	)
}

function ItemRow({ item, onRemove }: { item: ListItem; onRemove: () => void }) {
	if (item.quest) return <QuestItem item={item} onRemove={onRemove} />
	if (item.save) return <SaveItem item={item} onRemove={onRemove} />
	return null
}

export function ListDetailView({
	list,
	isLoading,
	onUpdate,
	onRemoveItem,
	isUpdating,
}: {
	list: ListWithItems | undefined
	isLoading: boolean
	onUpdate: (name: string, description?: string, color?: string) => void
	onRemoveItem: (itemId: string) => void
	isUpdating: boolean
}) {
	const [editOpen, setEditOpen] = useState(false)
	const [search, setSearch] = useState('')
	const accent = listAccentColor(list?.color ?? null)

	const filteredItems = search.trim() && list
		? list.items.filter((item) => {
			const q = search.toLowerCase()
			if (item.quest) return item.quest.title.toLowerCase().includes(q)
			if (item.save) return (
				(item.save.title ?? '').toLowerCase().includes(q) ||
				item.save.sourceUrl.toLowerCase().includes(q)
			)
			return false
		})
		: list?.items ?? []

	function handleEditSubmit(name: string, description?: string, color?: string) {
		onUpdate(name, description, color)
		setEditOpen(false)
	}

	const editInitial: List | undefined = list
		? { id: list.id, userId: list.userId, name: list.name, description: list.description, color: list.color, createdAt: list.createdAt, updatedAt: list.updatedAt }
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
				<Stack gap="xs">
					<Skeleton height={22} width="40%" />
					<Skeleton height={14} width="60%" />
				</Stack>
			) : list ? (
				<Box
					style={{
						borderLeft: `4px solid ${accent}`,
						paddingLeft: 12,
					}}
				>
					<Group gap="xs" align="flex-start" wrap="nowrap">
						<Stack gap={2} style={{ flex: 1 }}>
							<Text fw={700} size="lg">{list.name}</Text>
							{list.description && (
								<Text size="sm" c="dimmed">{list.description}</Text>
							)}
						</Stack>
						<Tooltip label="Edit list" withArrow>
							<ActionIcon variant="subtle" color="gray" size="sm" onClick={() => setEditOpen(true)}>
								<IconEdit size={15} />
							</ActionIcon>
						</Tooltip>
					</Group>
				</Box>
			) : (
				<Text c="dimmed">List not found.</Text>
			)}

			{list && (
				<Stack gap="xs">
					<Group justify="space-between" align="center">
						<Text size="xs" c="dimmed" fw={500} tt="uppercase">
							Items ({list.items.length})
						</Text>
					</Group>
					{list.items.length > 0 && (
						<TextInput
							placeholder="Search items…"
							leftSection={<IconSearch size={14} />}
							size="xs"
							value={search}
							onChange={(e) => setSearch(e.currentTarget.value)}
						/>
					)}
					{list.items.length === 0 ? (
						<Text size="sm" c="dimmed">No items in this list yet.</Text>
					) : filteredItems.length === 0 ? (
						<Text size="sm" c="dimmed">No items match "{search}"</Text>
					) : (
						<Stack gap={6}>
							{filteredItems.map((item) => (
								<ItemRow key={item.id} item={item} onRemove={() => onRemoveItem(item.id)} />
							))}
						</Stack>
					)}
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
