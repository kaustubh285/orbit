import { useOrbitAppStore } from "@/store/orbit-app.store"
import { TimelineView } from "./timeline.view"
import { useTimeline } from "./use-timeline.hook"
import { Center, Stack, Text } from "@mantine/core"
import { IconEyeOff } from "@tabler/icons-react"

export function TimelinePage() {
	const { months, isLoading, isFetchingNextPage, hasNextPage, isEmpty, fetchNextPage } = useTimeline()
	const { privacyMode } = useOrbitAppStore()

	if (privacyMode) {
		return (
			<Center style={{ height: "60vh" }}>
				<Stack align="center" gap="sm">
					<IconEyeOff size={36} color="var(--mantine-color-dimmed)" stroke={1.5} />
					<Text fw={600} size="md">Privacy mode is on</Text>
					<Text size="sm" c="dimmed" ta="center" maw={260}>
						Your timeline is hidden while privacy mode is enabled.
					</Text>
				</Stack>
			</Center>
		)
	}

	return (
		<TimelineView
			months={months}
			isLoading={isLoading}
			isFetchingNextPage={isFetchingNextPage}
			hasNextPage={hasNextPage}
			isEmpty={isEmpty}
			onLoadMore={fetchNextPage}
		/>
	)
}
