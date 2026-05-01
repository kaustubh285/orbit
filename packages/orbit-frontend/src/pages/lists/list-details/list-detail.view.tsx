import type { GetListsByIdResponse } from '@orbit/client'
import {
	ActionIcon,
	Badge,
	Box,
	Card,
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
	IconBrandInstagram,
	IconBrandReddit,
	IconBrandYoutube,
	IconEdit,
	IconExternalLink,
	IconSearch,
	IconTrash,
	IconWorld,
} from '@tabler/icons-react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import type { List } from '@/types'
import { listAccentColor } from '../lists.utils'
import { ListFormDrawer } from '../list-form-drawer.component'
import { useState } from 'react'

dayjs.extend(relativeTime)

type ListWithItems = Extract<GetListsByIdResponse, { items: unknown[] }>
type ListItem = ListWithItems['items'][number]

type Platform = 'youtube' | 'reddit' | 'instagram' | 'web'

const PLATFORM_META: Record<Platform, { label: string; color: string; Icon: React.ElementType }> = {
	youtube: { label: 'YouTube', color: 'red', Icon: IconBrandYoutube },
	reddit: { label: 'Reddit', color: 'orange', Icon: IconBrandReddit },
	instagram: { label: 'Instagram', color: 'grape', Icon: IconBrandInstagram },
	web: { label: 'Web', color: 'cyan', Icon: IconWorld },
}

const QUEST_TYPE_LABELS: Record<string, string> = {
	todo: 'To-do',
	note: 'Note',
	event: 'Event',
	daily: 'Daily',
}

function SaveItemCard({ item, onRemove }: { item: ListItem; onRemove: () => void }) {
	const save = item.save!
	const meta = PLATFORM_META[save.sourcePlatform as Platform]
	const PlatformIcon = meta.Icon

	return (
		<Card withBorder radius="md" padding={0} style={{ overflow: 'hidden' }}>
			<Group wrap="nowrap" gap={0} style={{ minHeight: 80 }}>
				{save.thumbnailUrl ? (
					<Box
						style={{
							width: '35%',
							flexShrink: 0,
							alignSelf: 'stretch',
							backgroundImage: `url(${save.thumbnailUrl})`,
							backgroundSize: 'cover',
							backgroundPosition: 'center',
							position: 'relative',
							minHeight: 80,
						}}
					>
						<Badge
							size="xs"
							color={meta.color}
							variant="filled"
							leftSection={<PlatformIcon size={10} />}
							style={{ position: 'absolute', top: 6, left: 6 }}
						>
							{meta.label}
						</Badge>
					</Box>
				) : (
					<Box
						style={{
							width: '35%',
							flexShrink: 0,
							alignSelf: 'stretch',
							background: `var(--mantine-color-${meta.color}-1)`,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							position: 'relative',
							minHeight: 80,
						}}
					>
						<PlatformIcon size={24} color={`var(--mantine-color-${meta.color}-5)`} />
						<Badge
							size="xs"
							color={meta.color}
							variant="filled"
							leftSection={<PlatformIcon size={10} />}
							style={{ position: 'absolute', top: 6, left: 6 }}
						>
							{meta.label}
						</Badge>
					</Box>
				)}

				<Stack gap={4} p="sm" style={{ flex: 1, minWidth: 0 }}>
					<Group justify="space-between" align="flex-start" wrap="nowrap">
						<Text fw={600} size="sm" lineClamp={1} style={{ flex: 1 }}>
							{save.title ?? save.sourceUrl}
						</Text>
						<Group gap={4} wrap="nowrap" style={{ flexShrink: 0 }}>
							<Tooltip label="Open link" withArrow>
								<ActionIcon
									component="a"
									href={save.sourceUrl}
									target="_blank"
									rel="noopener noreferrer"
									variant="subtle"
									color="gray"
									size="sm"
								>
									<IconExternalLink size={13} />
								</ActionIcon>
							</Tooltip>
							<Tooltip label="Remove from list" withArrow>
								<ActionIcon variant="subtle" color="gray" size="sm" onClick={onRemove}>
									<IconTrash size={13} />
								</ActionIcon>
							</Tooltip>
						</Group>
					</Group>

					{save.description && (
						<Text size="xs" c="dimmed" lineClamp={1}>
							{save.description}
						</Text>
					)}

					{save.note && (
						<Text size="xs" fs="italic" c="yellow.7" lineClamp={1}>
							{save.note}
						</Text>
					)}

					<Text size="xs" c="dimmed">
						{save.author && `${save.author} · `}
						{dayjs(save.createdAt).fromNow()}
					</Text>
				</Stack>
			</Group>
		</Card>
	)
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

function SectionHeader({ label, count }: { label: string; count: number }) {
	return (
		<Text size="xs" c="dimmed" fw={600} tt="uppercase" style={{ letterSpacing: '0.05em' }}>
			{label} ({count})
		</Text>
	)
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

	const allItems = list?.items ?? []

	const filteredItems = search.trim()
		? allItems.filter((item) => {
			const q = search.toLowerCase()
			if (item.quest) return item.quest.title.toLowerCase().includes(q)
			if (item.save) return (
				(item.save.title ?? '').toLowerCase().includes(q) ||
				item.save.sourceUrl.toLowerCase().includes(q) ||
				(item.save.description ?? '').toLowerCase().includes(q) ||
				(item.save.note ?? '').toLowerCase().includes(q)
			)
			return false
		})
		: allItems

	const saveItems = filteredItems.filter((i) => i.save)
	const questItems = filteredItems.filter((i) => i.quest)

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
				<Box style={{ borderLeft: `4px solid ${accent}`, paddingLeft: 12 }}>
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
				<Stack gap="md">
					{allItems.length > 0 && (
						<TextInput
							placeholder="Search items…"
							leftSection={<IconSearch size={14} />}
							size="sm"
							value={search}
							onChange={(e) => setSearch(e.currentTarget.value)}
						/>
					)}

					{allItems.length === 0 ? (
						<Text size="sm" c="dimmed">No items in this list yet.</Text>
					) : filteredItems.length === 0 ? (
						<Text size="sm" c="dimmed">No items match "{search}"</Text>
					) : (
						<Stack gap="xl">
							{saveItems.length > 0 && (
								<Stack gap="sm">
									<SectionHeader label="Saves" count={saveItems.length} />
									{saveItems.map((item) => (
										<SaveItemCard key={item.id} item={item} onRemove={() => onRemoveItem(item.id)} />
									))}
								</Stack>
							)}

							{questItems.length > 0 && (
								<Stack gap="sm">
									<SectionHeader label="Quests" count={questItems.length} />
									{questItems.map((item) => (
										<QuestItem key={item.id} item={item} onRemove={() => onRemoveItem(item.id)} />
									))}
								</Stack>
							)}
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
