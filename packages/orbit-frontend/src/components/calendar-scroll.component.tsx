import { Button, Flex } from "@mantine/core"
import { useMediaQuery, useElementSize } from "@mantine/hooks"
import { MiniCalendar } from "@mantine/dates"
import dayjs from "dayjs"
import { useCallback, useEffect, useRef, useState } from "react"
import { useQuestsStore } from "@/store/quests.store"
import { CachedItems } from "./app-structure/cached-items.component"

const todayStr = dayjs().format("YYYY-MM-DD")

const NAV_BUTTONS_PX = 72

export default function CalendarScroll() {
	const selectedDate = useQuestsStore((state) => state.selectedDate)
	const setSelectedDate = useQuestsStore((state) => state.actions.setSelectedDate)

	const { ref: sizeRef, width } = useElementSize<HTMLDivElement>()
	const containerRef = useRef<HTMLDivElement | null>(null)
	const isDesktop = useMediaQuery("(min-width: 768px)")

	const numberOfDays = isDesktop ? 14 : 7
	const daysBefore = Math.floor(numberOfDays / 2)

	const todayViewStart = dayjs().subtract(daysBefore, "day").format("YYYY-MM-DD")
	const [viewDate, setViewDate] = useState(todayViewStart)

	const cellSize = width > 0
		? Math.floor((width - NAV_BUTTONS_PX) / numberOfDays)
		: 40

	const isToday = selectedDate === todayStr

	const setRef = useCallback((el: HTMLDivElement | null) => {
		containerRef.current = el
		sizeRef(el)
	}, [sizeRef])

	useEffect(() => {
		const todayEl = containerRef.current?.querySelector<HTMLElement>("[data-today]")
		todayEl?.scrollIntoView({ behavior: "instant", block: "nearest", inline: "center" })
	}, [isDesktop])

	function goToToday() {
		setSelectedDate(todayStr)
		setViewDate(todayViewStart)
	}

	return (
		<div ref={setRef} style={{ width: "100%" }}>
			<div className="mini-calendar" style={{ paddingBottom: 4 }}>
				<MiniCalendar
					value={selectedDate}
					onChange={setSelectedDate}
					date={viewDate}
					onDateChange={setViewDate}
					numberOfDays={numberOfDays}
					size="md"
					getDayProps={(date) => ({
						...(date === todayStr ? { "data-today": true } : {}),
						"data-weekday": dayjs(date).format("ddd"),
					})}
					styles={{
						root: { width: "100%" },
						day: { width: cellSize, minWidth: "unset", height: "unset", paddingTop: 2, paddingBottom: 2 },
					}}
				/>
			</div>
			<Flex pl={8} gap={8} justify="space-between" align="center">
				<CachedItems />
				<Button
					size="compact-xs"
					variant={isToday ? "subtle" : "light"}
					color="ocean-blue"
					disabled={isToday}
					onClick={goToToday}
				>
					Today
				</Button>
			</Flex>
		</div>
	)
}
