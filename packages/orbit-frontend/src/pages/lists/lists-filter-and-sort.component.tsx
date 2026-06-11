import { ActionIcon, Indicator, Menu } from '@mantine/core'
import {
	IconCheck,
	IconFilter,
	IconLayoutGrid,
	IconLayoutList,
	IconSortAscending,
	IconSortDescending,
} from '@tabler/icons-react'

export type SortField = 'name' | 'createdAt' | 'saveCreatedAt'
export type SortDir = 'asc' | 'desc'
export type ListViewMode = 'grid' | 'row'

type Props = {
	view: ListViewMode
	setView: (v: ListViewMode) => void
	sortField: SortField
	setSortField: (f: SortField) => void
	sortDir: SortDir
	setSortDir: (d: SortDir) => void
}

const SORT_LABELS: Record<SortField, string> = {
	name: 'Name',
	createdAt: 'Date created',
	saveCreatedAt: 'Last saved',
}

export function ListsFilterAndSort({ view, setView, sortField, setSortField, sortDir, setSortDir }: Props) {
	const isNonDefault = sortField !== 'saveCreatedAt' || sortDir !== 'desc'

	return (
		<Menu closeOnItemClick={false} width={220} position="bottom-end">
			<Menu.Target>
				<Indicator size={8} disabled={!isNonDefault} color="amber" offset={4}>
					<ActionIcon variant="default" size="lg" aria-label="Sort and view options">
						<IconFilter size={16} />
					</ActionIcon>
				</Indicator>
			</Menu.Target>

			<Menu.Dropdown>
				<Menu.Label>Sort by</Menu.Label>
				{(Object.entries(SORT_LABELS) as [SortField, string][]).map(([field, label]) => (
					<Menu.Item
						key={field}
						onClick={() => setSortField(field)}
						rightSection={sortField === field ? <IconCheck size={13} /> : null}
					>
						{label}
					</Menu.Item>
				))}

				<Menu.Divider />
				<Menu.Label>Direction</Menu.Label>
				<Menu.Item
					onClick={() => setSortDir('asc')}
					leftSection={<IconSortAscending size={14} />}
					rightSection={sortDir === 'asc' ? <IconCheck size={13} /> : null}
				>
					Ascending
				</Menu.Item>
				<Menu.Item
					onClick={() => setSortDir('desc')}
					leftSection={<IconSortDescending size={14} />}
					rightSection={sortDir === 'desc' ? <IconCheck size={13} /> : null}
				>
					Descending
				</Menu.Item>

				<Menu.Divider />
				<Menu.Label>View</Menu.Label>
				<Menu.Item
					onClick={() => setView('grid')}
					leftSection={<IconLayoutGrid size={14} />}
					rightSection={view === 'grid' ? <IconCheck size={13} /> : null}
				>
					Grid
				</Menu.Item>
				<Menu.Item
					onClick={() => setView('row')}
					leftSection={<IconLayoutList size={14} />}
					rightSection={view === 'row' ? <IconCheck size={13} /> : null}
				>
					Row
				</Menu.Item>
			</Menu.Dropdown>
		</Menu>
	)
}
