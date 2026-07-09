import type { List } from '@/types'
import { Button, Group, SimpleGrid, Stack, Text, TextInput } from '@mantine/core'
import { IconList, IconPlus, IconSearch } from '@tabler/icons-react'
import { useState } from 'react'
import { ListCard, ListCardSkeleton } from './list-card.component'
import { ListFormDrawer } from './list-form-drawer.component'
import { ListRow, ListRowSkeleton } from './list-row.component'
import { ListsFilterAndSort, type ListViewMode, type SortDir, type SortField } from './lists-filter-and-sort.component'

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
	onCreate: (name: string, description?: string, color?: string, icon?: string, includeInResurface?: boolean) => void
	onUpdate: (id: string, name: string, description?: string, color?: string, icon?: string, includeInResurface?: boolean) => void
	onDelete: (id: string) => void
	isCreating: boolean
}) {
	const [view, setView] = useState<ListViewMode>('grid')
	const [sortField, setSortField] = useState<SortField>('saveCreatedAt')
	const [sortDir, setSortDir] = useState<SortDir>('desc')
	const [createOpen, setCreateOpen] = useState(false)
	const [editTarget, setEditTarget] = useState<List | null>(null)
	const [search, setSearch] = useState('')

	const filteredLists = lists
		.filter((l) => {
			if (!search.trim()) return true
			const q = search.toLowerCase()
			return l.name.toLowerCase().includes(q) || (l.description ?? '').toLowerCase().includes(q)
		})
		.sort((a, b) => {
			let cmp = 0
			if (sortField === 'name') {
				cmp = a.name.localeCompare(b.name)
			} else if (sortField === 'createdAt') {
				cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
			} else {
				const aDate = a.recentSave?.createdAt ? new Date(a.recentSave.createdAt).getTime() : 0
				const bDate = b.recentSave?.createdAt ? new Date(b.recentSave.createdAt).getTime() : 0
				cmp = aDate - bDate
			}
			return sortDir === 'asc' ? cmp : -cmp
		})

	function handleEditSubmit(name: string, description?: string, color?: string, icon?: string, includeInResurface?: boolean) {
		if (!editTarget) return
		onUpdate(editTarget.id, name, description, color, icon, includeInResurface)
		setEditTarget(null)
	}

	return (
		<Stack gap="md" pb="md">
			<Group justify="space-between">
				<Text fw={600} size="lg">Lists</Text>
				<Group gap="xs">
					<ListsFilterAndSort
						view={view} setView={setView}
						sortField={sortField} setSortField={setSortField}
						sortDir={sortDir} setSortDir={setSortDir}
					/>
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
