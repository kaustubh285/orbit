import CalendarScroll from "@/components/calendar-scroll.component"
import ListQuestsComponent from "@/components/quests/list-quests.component"
import { QuestModalComponent } from "@/components/quest-modal.component"
import { useQuestsStore } from "@/store/quests.store"
import { Stack } from "@mantine/core"
import { useHome } from "./use-home.hook"
import { useAuth } from "@clerk/react"
import { useNavigate } from "@tanstack/react-router"
import ROUTES from "@/routes"

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
