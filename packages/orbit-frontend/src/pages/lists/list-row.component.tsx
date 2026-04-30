import type { List } from '@/types'
import { Group, Skeleton, Stack, Text } from '@mantine/core'
import { Link } from '@tanstack/react-router'
import { listAccentColor } from './lists.utils'
import { ListMenu } from './list-menu.component'

export function ListRow({
	list,
	onEdit,
	onDelete,
}: {
	list: List
	onEdit: (list: List) => void
	onDelete: (id: string) => void
}) {
	const accent = listAccentColor(list.color)

	return (
		<Group
			justify="space-between"
			wrap="nowrap"
			style={{
				padding: '8px 10px',
				paddingLeft: 10,
				borderBottom: '1px dotted var(--mantine-color-dark-4)',
				borderLeft: `3px solid ${accent}`,
			}}
		>
			<Link
				to="/lists/$id"
				params={{ id: list.id }}
				style={{ flex: 1, minWidth: 0, textDecoration: 'none', color: 'inherit' }}
			>
				<Stack gap={2}>
					<Text size="sm" fw={500} truncate>{list.name}</Text>
					{list.description && (
						<Text size="xs" c="dimmed" truncate>{list.description}</Text>
					)}
				</Stack>
			</Link>
			<ListMenu list={list} onEdit={onEdit} onDelete={onDelete} />
		</Group>
	)
}

export function ListRowSkeleton() {
	return (
		<Group style={{ padding: '8px 10px', borderBottom: '1px dotted var(--mantine-color-dark-4)' }}>
			<Skeleton height={12} width="40%" />
		</Group>
	)
}
