import type { List } from '@/types'
import { Box, Group, Skeleton, Stack, Text } from '@mantine/core'
import { IconBookmark } from '@tabler/icons-react'
import { Link } from '@tanstack/react-router'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { listAccentColor } from './lists.utils'
import { ListMenu } from './list-menu.component'
import { PrivacyAwareText } from '@/components/privacy-aware-text.component'

dayjs.extend(relativeTime)

function formatSaveDate(dateStr: string) {
	const date = dayjs(dateStr)
	return dayjs().diff(date, 'day') < 7
		? date.fromNow()
		: date.format('MMM D, YYYY')
}

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
				borderRadius: 12,
				border: '1px solid var(--mantine-color-dark-4)',
				background: 'var(--mantine-color-dark-7)',
				overflow: 'hidden',
				display: 'flex',
				flexDirection: 'column',
			}}

		>
			{/* Hero — always accent gradient, icon + name */}
			<Link
				to="/lists/$id"
				params={{ id: list.id }}
				style={{ textDecoration: 'none', color: 'inherit' }}
			>
				<Box
					style={{
						position: 'relative',
						aspectRatio: '5/2',
						background: `linear-gradient(135deg, ${accent}33, ${accent}66)`,
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'flex-start',
						justifyContent: 'flex-end',
						padding: '10px 12px',
					}}
				>
					<Text style={{ fontSize: 30, lineHeight: 1, marginBottom: 6 }}>{list.icon}</Text>
					<PrivacyAwareText fw={700} size="sm" style={{ color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.5)' }} lineClamp={1}>
						{list.name}
					</PrivacyAwareText>
					<PrivacyAwareText size="xs" style={{ color: 'rgba(255,255,255,0.65)' }} lineClamp={1}>
						{list.description ?? '--'}
					</PrivacyAwareText>

					{/* Accent bar */}
					<Box style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: accent }} />
				</Box>

				{/* Recent save row */}
				{list.recentSave ? (
					<Group gap="sm" wrap="nowrap" px="sm" py={10} align="center">
						{list.recentSave.thumbnailUrl ? (
							<PrivacyAwareText
								style={{
									width: 36,
									height: 36,
									flexShrink: 0,
									borderRadius: 5,
									backgroundImage: `url(${list.recentSave.thumbnailUrl})`,
									backgroundSize: 'cover',
									backgroundPosition: 'center',
									border: '1px solid var(--mantine-color-dark-4)',
								}}
							>
								<span />
							</PrivacyAwareText>
						) : (
							<PrivacyAwareText
								style={{
									width: 36,
									height: 36,
									flexShrink: 0,
									borderRadius: 5,
									background: `${accent}22`,
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									border: '1px solid var(--mantine-color-dark-4)',
								}}
							>
								<IconBookmark size={14} style={{ color: accent }} />
							</PrivacyAwareText>
						)}
						<Stack gap={1} style={{ minWidth: 0, flex: 1 }}>
							<PrivacyAwareText size="xs" fw={500} truncate>
								{list.recentSave.title ?? list.recentSave.sourceUrl}
							</PrivacyAwareText>
							<PrivacyAwareText size="xs" c="dimmed">
								{formatSaveDate(list.recentSave.createdAt)}
							</PrivacyAwareText>
						</Stack>
					</Group>
				) : (
					<Group px="sm" py={10}>
						<Text size="xs" c="dimmed">No saves yet</Text>
					</Group>
				)}
			</Link>

			<Group justify="flex-end" px="sm" pb={6} mt={-4}>
				<ListMenu list={list} onEdit={onEdit} onDelete={onDelete} />
			</Group>
		</Box>
	)
}

export function ListCardSkeleton() {
	return (
		<Box style={{ borderRadius: 12, border: '1px solid var(--mantine-color-dark-4)', overflow: 'hidden' }}>
			<Skeleton height={0} style={{ aspectRatio: '5/2' }} radius={0} />
			<Group gap="sm" px="sm" py={10}>
				<Skeleton height={36} width={36} radius="sm" />
				<Stack gap={4} style={{ flex: 1 }}>
					<Skeleton height={11} width="70%" />
					<Skeleton height={9} width="35%" />
				</Stack>
			</Group>
		</Box>
	)
}
