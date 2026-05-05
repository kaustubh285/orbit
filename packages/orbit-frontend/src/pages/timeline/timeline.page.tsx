import { TimelineView } from "./timeline.view"
import { useTimeline } from "./use-timeline.hook"

export function TimelinePage() {
	const { months, isLoading, isFetchingNextPage, hasNextPage, isEmpty, fetchNextPage } = useTimeline()

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
