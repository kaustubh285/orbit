import CalendarScroll from "@/components/calendar-scroll.component"
import ListQuestsComponent from "@/components/list-quests.component"
import { QuestModalComponent } from "@/components/quest-modal.component"
import type { Quest } from "@/types"
import { Stack } from "@mantine/core"
import dayjs from "dayjs"
import { useState } from "react"
import { useHome } from "./use-home.hook"

export function HomePage() {
	const [selectedDate, setSelectedDate] = useState<string | null>(dayjs().format("YYYY-MM-DD"))
	const [modalQuest, setModalQuest] = useState<Quest | null>(null)
	const { quests, submitQuest, toggleQuest, editQuest } = useHome(selectedDate)

	return (
		<Stack gap="xs">
			<CalendarScroll value={selectedDate} onChange={setSelectedDate} />
			<ListQuestsComponent
				quests={quests.data ?? []}
				isLoading={quests.isLoading}
				onSubmit={submitQuest}
				onToggle={toggleQuest}
				onOpen={setModalQuest}
			/>
			<QuestModalComponent
				quest={modalQuest}
				onClose={() => setModalQuest(null)}
				onSave={editQuest}
			/>
		</Stack>
	)
}
