import dayjs from "dayjs"
import { Box, Group, Modal, Stack, Text } from "@mantine/core"
import { Calendar } from "@mantine/dates"
import { useState } from "react"
import { TYPE_COLOR } from "@/CONSTANTS"
import { useQuestsStore } from "@/store/quests.store"
import { useQuestCounts } from "@/pages/home/use-home.hook"
import type { Quest } from "@/types"

const todayStr = dayjs().format("YYYY-MM-DD")

export function MassiveCalendar({ opened, onClose }: { opened: boolean; onClose: () => void }) {
	const setSelectedDate = useQuestsStore((s) => s.actions.setSelectedDate)

	const [month, setMonth] = useState(dayjs().startOf("month").format("YYYY-MM-DD"))
	const start = dayjs(month).startOf("month").format("YYYY-MM-DD")
	const end = dayjs(month).endOf("month").format("YYYY-MM-DD")

	const { data: counts } = useQuestCounts(start, end)

	const countsByDate = Object.fromEntries(
		(counts ?? []).map((entry) => [entry.date, entry])
	)

	function handleDayClick(date: Date | string) {
		setSelectedDate(dayjs(date).format("YYYY-MM-DD"))
		onClose()
	}

	return (
		<Modal opened={opened} onClose={onClose} title="Calendar" size="lg" styles={{ body: { paddingTop: 8 } }}>
			<Stack gap="md">
				<Calendar
					fullWidth
					date={month}
					onDateChange={setMonth}
					getDayProps={(date) => ({ onClick: () => handleDayClick(date) })}
					renderDay={(date) => {
						const key = dayjs(date).format("YYYY-MM-DD")
						const data = countsByDate[key]
						const isToday = key === todayStr

						return (
							<Stack
								gap={2}
								align="center"
								style={{ width: "100%", cursor: "pointer" }}
							>
								<Text
									size="sm"
									fw={isToday ? 700 : undefined}
									c={isToday ? "ocean-blue" : undefined}
									style={{ lineHeight: 1 }}
								>
									{dayjs(date).date()}
								</Text>
								{data ? (
									<Group gap={2} justify="center">
										{data.types.map((type) => (
											<Box
												key={type}
												style={{
													width: 5,
													height: 5,
													borderRadius: "50%",
													flexShrink: 0,
													backgroundColor: `var(--mantine-color-${TYPE_COLOR[type as Quest["type"]]}-5)`,
												}}
											/>
										))}
									</Group>
								) : (
									<Box style={{ height: 5 }} />
								)}
							</Stack>
						)
					}}
				/>
				<Group gap="sm" justify="center" wrap="wrap">
					{(Object.keys(TYPE_COLOR) as Quest["type"][]).map((type) => (
						<Group key={type} gap={4}>
							<Box
								style={{
									width: 8,
									height: 8,
									borderRadius: "50%",
									backgroundColor: `var(--mantine-color-${TYPE_COLOR[type]}-5)`,
								}}
							/>
							<Text size="xs" c="dimmed">{type}</Text>
						</Group>
					))}
				</Group>
			</Stack>
		</Modal>
	)
}
