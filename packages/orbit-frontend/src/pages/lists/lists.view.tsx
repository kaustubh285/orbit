import type { List } from '@/types'
import { ActionIcon, Button, Group, SimpleGrid, Stack, Text, TextInput } from '@mantine/core'
import { IconLayoutGrid, IconLayoutList, IconList, IconPlus, IconSearch } from '@tabler/icons-react'
import { useState } from 'react'
import { ListCard, ListCardSkeleton } from './list-card.component'
import { ListFormDrawer } from './list-form-drawer.component'
import { ListRow, ListRowSkeleton } from './list-row.component'

export function ListsView({
	lists,
	isLoading,
	onCreate,
	onUpdate,
	onDelete,
	isCreating,
}: {
	lists: List[]
	isLoading: boolean
	onCreate: (name: string, description?: string, color?: string) => void
	onUpdate: (id: string, name: string, description?: string, color?: string) => void
	onDelete: (id: string) => void
	isCreating: boolean
}) {
	const [view, setView] = useState<'grid' | 'row'>('grid')
	const [createOpen, setCreateOpen] = useState(false)
	const [editTarget, setEditTarget] = useState<List | null>(null)
	const [search, setSearch] = useState('')

	const filteredLists = search.trim()
		? lists.filter((l) => {
			const q = search.toLowerCase()
			return l.name.toLowerCase().includes(q) || (l.description ?? '').toLowerCase().includes(q)
		})
		: lists

	function handleEditSubmit(name: string, description?: string, color?: string) {
		if (!editTarget) return
		onUpdate(editTarget.id, name, description, color)
		setEditTarget(null)
	}

	return (
		<Stack gap="md">
			<Group justify="space-between">
				<Text fw={600} size="lg">Lists</Text>
				<Group gap="xs">
					<ActionIcon
						variant={view === 'grid' ? 'filled' : 'subtle'}
						color="gray"
						size="sm"
						onClick={() => setView('grid')}
						aria-label="Grid view"
					>
						<IconLayoutGrid size={14} />
					</ActionIcon>
					<ActionIcon
						variant={view === 'row' ? 'filled' : 'subtle'}
						color="gray"
						size="sm"
						onClick={() => setView('row')}
						aria-label="Row view"
					>
						<IconLayoutList size={14} />
					</ActionIcon>
					<Button size="xs" leftSection={<IconPlus size={12} />} onClick={() => setCreateOpen(true)}>
						New list
					</Button>
				</Group>
			</Group>

			<TextInput
				placeholder="Search lists…"
				leftSection={<IconSearch size={14} />}
				size="xs"
				value={search}
				onChange={(e) => setSearch(e.currentTarget.value)}
			/>

			{view === 'grid' ? (
				<SimpleGrid cols={{ xs: 2, base: 2, sm: 2, md: 3 }} spacing="sm">
					{isLoading
						? [1, 2, 3, 4].map((i) => <ListCardSkeleton key={i} />)
						: filteredLists.map((list) => (
							<ListCard key={list.id} list={list} onEdit={setEditTarget} onDelete={onDelete} />
						))}
				</SimpleGrid>
			) : (
				<Stack gap={9}>
					{isLoading
						? [1, 2, 3, 4].map((i) => <ListRowSkeleton key={i} />)
						: filteredLists.map((list) => (
							<ListRow key={list.id} list={list} onEdit={setEditTarget} onDelete={onDelete} />
						))}
				</Stack>
			)}

			{!isLoading && lists.length === 0 && (
				<Stack align="center" gap="xs" mt="xl">
					<IconList size={32} color="var(--mantine-color-dimmed)" />
					<Text c="dimmed" size="sm">No lists yet</Text>
					<Button size="xs" variant="light" onClick={() => setCreateOpen(true)}>
						Create your first list
					</Button>
				</Stack>
			)}

			{!isLoading && lists.length > 0 && filteredLists.length === 0 && (
				<Stack align="center" gap="xs" mt="xl">
					<Text c="dimmed" size="sm">No lists match "{search}"</Text>
				</Stack>
			)}

			<ListFormDrawer
				opened={createOpen}
				onClose={() => setCreateOpen(false)}
				onSubmit={onCreate}
				isPending={isCreating}
			/>

			{/* key forces remount when editTarget changes, so useState initializers re-run with fresh values */}
			<ListFormDrawer
				key={editTarget?.id}
				opened={!!editTarget}
				onClose={() => setEditTarget(null)}
				onSubmit={handleEditSubmit}
				isPending={false}
				initial={editTarget ?? undefined}
			/>
		</Stack>
	)
}
