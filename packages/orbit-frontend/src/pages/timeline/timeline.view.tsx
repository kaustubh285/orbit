import type { TimelineMonth } from "./use-timeline.hook"
import { Box, Button, Divider, Loader, Center, Stack, Text } from "@mantine/core"

function RemembralCard({ title, emoji, body }: { title: string; emoji: string | null; body: string | null }) {
	const bodyText = body ? body.replace(/<[^>]+>/g, "").trim() : null

	return (
		<Box
			style={{
				display: "flex",
				alignItems: "flex-start",
				gap: 10,
				padding: "6px 0",
			}}
		>
			<Box
				style={{
					width: 8,
					height: 8,
					borderRadius: "50%",
					background: "var(--mantine-color-violet-5)",
					flexShrink: 0,
					marginTop: 6,
				}}
			/>
			<Stack gap={2} style={{ flex: 1 }}>
				<Text size="sm">
					{emoji && <span style={{ marginRight: 6 }}>{emoji}</span>}
					{title}
				</Text>
				{bodyText && (
					<Text size="xs" c="dimmed" lineClamp={2}>{bodyText}</Text>
				)}
			</Stack>
		</Box>
	)
}

function TimelineDayGroup({ date, relativeLabel, remembrals }: {
	date: string
	relativeLabel: string
	remembrals: Array<{ id: string; title: string; emoji: string | null; body: string | null }>
}) {
	const [, month, day] = date.split("-")
	const displayDate = `${parseInt(month)}/${parseInt(day)}`

	return (
		<Box mb="xs">
			<Box
				style={{
					display: "flex",
					alignItems: "baseline",
					gap: 8,
					marginBottom: 4,
				}}
			>
				<Text size="sm" fw={600}>{displayDate}</Text>
				<Text size="xs" c="dimmed">{relativeLabel}</Text>
			</Box>
			<Box pl="md" style={{ borderLeft: "2px solid var(--mantine-color-dark-4)" }}>
				{remembrals.map((r) => (
					<RemembralCard key={r.id} title={r.title} emoji={r.emoji} body={r.body} />
				))}
			</Box>
		</Box>
	)
}

export function TimelineView({
	months,
	isLoading,
	isFetchingNextPage,
	hasNextPage,
	isEmpty,
	onLoadMore,
}: {
	months: TimelineMonth[]
	isLoading: boolean
	isFetchingNextPage: boolean
	hasNextPage: boolean
	isEmpty: boolean
	onLoadMore: () => void
}) {
	if (isLoading) {
		return (
			<Center mt="xl">
				<Loader size="sm" />
			</Center>
		)
	}

	if (isEmpty) {
		return (
			<Center mt="xl">
				<Stack align="center" gap="xs">
					<Text size="lg">No remembrals yet.</Text>
					<Text size="sm" c="dimmed">
						Tap + → Event → "Already happened" to capture a moment.
					</Text>
				</Stack>
			</Center>
		)
	}

	return (
		<Stack gap={0}>
			{months.map(({ monthLabel, days }) => (
				<Box key={monthLabel} mb="md">
					<Divider
						label={<Text size="xs" fw={600} c="dimmed">{monthLabel}</Text>}
						labelPosition="left"
						mb="sm"
					/>
					{days.map((day) => (
						<TimelineDayGroup key={day.date} {...day} />
					))}
				</Box>
			))}

			{hasNextPage && (
				<Button
					variant="subtle"
					size="xs"
					onClick={onLoadMore}
					loading={isFetchingNextPage}
					mx="auto"
					display="block"
					mt="sm"
				>
					Load more
				</Button>
			)}
		</Stack>
	)
}
