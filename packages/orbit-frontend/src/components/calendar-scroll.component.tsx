import { Box } from "@mantine/core"
import { MiniCalendar } from "@mantine/dates"
import dayjs from "dayjs"
import { useEffect, useRef } from "react"

const DAYS_BEFORE_TODAY = 5
const DAYS_AFTER_TODAY = 5

const startDate = dayjs().subtract(DAYS_BEFORE_TODAY, "day").toDate()
const today = dayjs().format("YYYY-MM-DD")

interface CalendarScrollProps {
	value: string | null
	onChange: (date: string) => void
}

export default function CalendarScroll({ value, onChange }: CalendarScrollProps) {
	const containerRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		const todayEl = containerRef.current?.querySelector<HTMLElement>("[data-today]")
		todayEl?.scrollIntoView({ behavior: "instant", block: "nearest", inline: "center" })
	}, [])

	return (
		<Box ref={containerRef} w="100%" style={{ overflowX: "auto" }} className="mini-calendar" pb="sm">
			<MiniCalendar
				value={value}
				onChange={onChange}
				defaultDate={startDate}
				numberOfDays={DAYS_BEFORE_TODAY + DAYS_AFTER_TODAY}
				size="md"
				getDayProps={(date) => (date === today ? { "data-today": true } : {})}
			/>
		</Box>
	)
}
