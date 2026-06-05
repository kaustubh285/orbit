import type { List } from '@/types'
import { Box, Group, Skeleton, Stack, Text } from '@mantine/core'
import { IconBookmark } from '@tabler/icons-react'
import { Link } from '@tanstack/react-router'
import { listAccentColor } from './lists.utils'
import { ListMenu } from './list-menu.component'
import { PrivacyAwareText } from '@/components/privacy-aware-text.component'

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
			gap={0}
			style={{
				borderRadius: 10,
				border: '1px solid var(--mantine-color-dark-4)',
				background: 'var(--mantine-color-dark-7)',
				overflow: 'hidden',
			}}
		>
			{/* Accent strip */}
			<Box style={{ width: 4, alignSelf: 'stretch', background: accent, flexShrink: 0 }} />

			<Link
				to="/lists/$id"
				params={{ id: list.id }}
				style={{ flex: 1, minWidth: 0, textDecoration: 'none', color: 'inherit', padding: '10px 12px' }}
			>
				<Group gap="sm" wrap="nowrap" align="center">
					<PrivacyAwareText style={{ fontSize: 22, lineHeight: 1, flexShrink: 0 }}>{list.icon}</PrivacyAwareText>
					<Stack gap={2} style={{ minWidth: 0, flex: 1 }}>
						<PrivacyAwareText size="sm" fw={600} truncate>{list.name}</PrivacyAwareText>
						{list.recentSave ? (
							<Group gap={4} wrap="nowrap">
								<IconBookmark size={10} style={{ color: accent, flexShrink: 0 }} />
								<PrivacyAwareText size="xs" c="dimmed" truncate>
									{list.recentSave.title ?? list.recentSave.sourceUrl}
								</PrivacyAwareText>
							</Group>
						) : list.description ? (
							<PrivacyAwareText size="xs" c="dimmed" truncate>{list.description}</PrivacyAwareText>
						) : null}
					</Stack>

					{/* Thumbnail */}
					{list.recentSave?.thumbnailUrl && (
						<PrivacyAwareText
							style={{
								width: 44,
								height: 44,
								flexShrink: 0,
								borderRadius: 6,
								backgroundImage: `url(${list.recentSave.thumbnailUrl})`,
								backgroundSize: 'cover',
								backgroundPosition: 'center',
								border: '1px solid var(--mantine-color-dark-4)',
							}}
						>
							<span />
						</PrivacyAwareText>
					)}
				</Group>
			</Link>

			<Box pr={8}>
				<ListMenu list={list} onEdit={onEdit} onDelete={onDelete} />
			</Box>
		</Group>
	)
}

export function ListRowSkeleton() {
	return (
		<Group
			wrap="nowrap"
			gap={0}
			style={{
				borderRadius: 10,
				border: '1px solid var(--mantine-color-dark-4)',
				overflow: 'hidden',
			}}
		>
			<Skeleton width={4} height={56} radius={0} />
			<Group gap="sm" wrap="nowrap" style={{ flex: 1, padding: '10px 12px' }}>
				<Skeleton height={22} width={22} radius="sm" />
				<Stack gap={4} style={{ flex: 1 }}>
					<Skeleton height={12} width="35%" />
					<Skeleton height={10} width="55%" />
				</Stack>
				<Skeleton height={44} width={44} radius="sm" />
			</Group>
		</Group>
	)
}
