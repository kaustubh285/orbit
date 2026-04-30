import type { List } from '@/types'
import { Box, Group, Skeleton, Stack, Text } from '@mantine/core'
import { Link } from '@tanstack/react-router'
import { listAccentColor } from './lists.utils'
import { ListMenu } from './list-menu.component'

export function ListCard({
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
		<Box
			style={{
				borderRadius: 8,
				border: '1px solid var(--mantine-color-dark-4)',
				borderTop: `3px solid ${accent}`,
				padding: '12px 14px',
				background: 'var(--mantine-color-dark-7)',
			}}
		>
			<Group justify="space-between" align="flex-start" wrap="nowrap">
				<Link
					to="/lists/$id"
					params={{ id: list.id }}
					style={{ flex: 1, minWidth: 0, textDecoration: 'none', color: 'inherit' }}
				>
					<Stack gap={4}>
						<Text fw={600} size="sm" truncate>{list.name}</Text>
						{list.description && (
							<Text size="xs" c="dimmed" lineClamp={2}>{list.description}</Text>
						)}
					</Stack>
				</Link>
				<ListMenu list={list} onEdit={onEdit} onDelete={onDelete} />
			</Group>
		</Box>
	)
}

export function ListCardSkeleton() {
	return (
		<Box style={{ borderRadius: 8, border: '1px solid var(--mantine-color-dark-4)', padding: '12px 14px' }}>
			<Skeleton height={14} width="60%" mb={8} />
			<Skeleton height={10} width="80%" />
		</Box>
	)
}
