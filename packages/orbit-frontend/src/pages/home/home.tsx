import CalendarScroll from "@/components/calendar-scroll.component"
import ListQuestsComponent from "@/components/list-quests.component"
import { QuestModalComponent } from "@/components/quest-modal.component"
import { useQuestsStore } from "@/store/quests.store"
import { Stack } from "@mantine/core"
import { useHome } from "./use-home.hook"

export function HomePage() {
	const modalQuest = useQuestsStore((state) => state.modalQuest)
	const { openModal, closeModal } = useQuestsStore((state) => state.actions)
	const { quests, submitQuest, toggleQuest, editQuest } = useHome()

	return (
		<Stack gap="xs">
			<CalendarScroll />
			<ListQuestsComponent
				quests={quests.data ?? []}
				isLoading={quests.isLoading}
				onSubmit={submitQuest}
				onToggle={toggleQuest}
				onOpen={openModal}
			/>
			<QuestModalComponent
				quest={modalQuest}
				onClose={closeModal}
				onSave={editQuest}
			/>
		</Stack>
	)
}
