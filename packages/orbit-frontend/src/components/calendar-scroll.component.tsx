import { Button } from "@mantine/core"
import { useMediaQuery, useElementSize } from "@mantine/hooks"
import { MiniCalendar } from "@mantine/dates"
import dayjs from "dayjs"
import { useEffect, useState } from "react"
import { useQuestsStore } from "@/store/quests.store"

const todayStr = dayjs().format("YYYY-MM-DD")

// Approximate combined width of the two prev/next nav buttons at size="md"
const NAV_BUTTONS_PX = 72

export default function CalendarScroll() {
	const selectedDate = useQuestsStore((state) => state.selectedDate)
	const setSelectedDate = useQuestsStore((state) => state.actions.setSelectedDate)

	const { ref, width } = useElementSize<HTMLDivElement>()
	const isDesktop = useMediaQuery("(min-width: 768px)")

	const numberOfDays = isDesktop ? 14 : 7
	const daysBefore = Math.floor(numberOfDays / 2)

	const todayViewStart = dayjs().subtract(daysBefore, "day").toDate()
	const [viewDate, setViewDate] = useState(todayViewStart)

	const cellSize = width > 0
		? Math.floor((width - NAV_BUTTONS_PX) / numberOfDays)
		: 40

	const isToday = selectedDate === todayStr

	useEffect(() => {
		const todayEl = ref.current?.querySelector<HTMLElement>("[data-today]")
		todayEl?.scrollIntoView({ behavior: "instant", block: "nearest", inline: "center" })
	}, [isDesktop])

	function goToToday() {
		setSelectedDate(todayStr)
		setViewDate(todayViewStart)
	}

	return (
		<div ref={ref} style={{ width: "100%" }}>
			<div className="mini-calendar" style={{ paddingBottom: 4 }}>
				<MiniCalendar
					value={selectedDate}
					onChange={setSelectedDate}
					date={viewDate}
					onDateChange={setViewDate}
					numberOfDays={numberOfDays}
					size="md"
					getDayProps={(date) => (date === todayStr ? { "data-today": true } : {})}
					styles={{
						root: { width: "100%" },
						calendarHeader: { maxWidth: "100%" },
						day: { width: cellSize, minWidth: "unset" },
					}}
				/>
			</div>
			<div style={{ display: "flex", justifyContent: "flex-end", paddingRight: 4 }}>
				<Button
					size="compact-xs"
					variant={isToday ? "subtle" : "light"}
					color="ocean-blue"
					disabled={isToday}
					onClick={goToToday}
				>
					Today
				</Button>
			</div>
		</div>
	)
}
