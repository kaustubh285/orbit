import { Box } from "@mantine/core"
import { useMediaQuery } from "@mantine/hooks"
import { MiniCalendar } from "@mantine/dates"
import dayjs from "dayjs"
import { useEffect, useRef } from "react"

const today = dayjs().format("YYYY-MM-DD")

const MOBILE_BEFORE = 5
const MOBILE_AFTER = 5
const DESKTOP_BEFORE = 15
const DESKTOP_AFTER = 15

interface CalendarScrollProps {
	value: string | null
	onChange: (date: string) => void
}

export default function CalendarScroll({ value, onChange }: CalendarScrollProps) {
	const containerRef = useRef<HTMLDivElement>(null)
	const isDesktop = useMediaQuery("(min-width: 768px)")

	const daysBefore = isDesktop ? DESKTOP_BEFORE : MOBILE_BEFORE
	const daysAfter = isDesktop ? DESKTOP_AFTER : MOBILE_AFTER
	const startDate = dayjs().subtract(daysBefore, "day").toDate()

	useEffect(() => {
		const todayEl = containerRef.current?.querySelector<HTMLElement>("[data-today]")
		todayEl?.scrollIntoView({ behavior: "instant", block: "nearest", inline: "center" })
	}, [isDesktop])

	return (
		<Box
			ref={containerRef}
			w="100%"
			style={{
				overflowX: "auto",
				display: "flex",
				justifyContent: isDesktop ? "center" : "flex-start",
			}}
			className="mini-calendar"
			pb="sm"
			pl={isDesktop ? "390px" : "0"}
		>
			<MiniCalendar
				value={value}
				onChange={onChange}
				defaultDate={startDate}
				numberOfDays={daysBefore + daysAfter}
				size="md"
				getDayProps={(date) => (date === today ? { "data-today": true } : {})}
			/>
		</Box>
	)
}
