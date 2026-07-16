import CalendarScroll from "@/components/calendar-scroll.component"
import ListQuestsComponent from "@/components/quests/list-quests.component"
import { QuestModalComponent } from "@/components/quest-modal.component"
import { useQuestsStore } from "@/store/quests.store"
import { Button, ButtonGroup, Group, Modal, Stack, Text } from "@mantine/core"
import { useDisclosure } from "@mantine/hooks"
import { useHome } from "./use-home.hook"
import { useAuth } from "@clerk/react"
import { useNavigate } from "@tanstack/react-router"
import ROUTES from "@/routes"
import { useEffect, useRef } from "react"

export function HomePage() {
	const modalQuest = useQuestsStore((state) => state.modalQuest)
	const { openModal, closeModal } = useQuestsStore((state) => state.actions)
	const { quests, questsData, isFromCache, submitQuest, toggleQuest, editQuest, incompleteQuests, moveQuestsToToday } = useHome()
	const [confirmOpened, { open: openConfirm, close: closeConfirm }] = useDisclosure(false)
	const hasPrompted = useRef(false)

	useEffect(() => {
		if (!hasPrompted.current && incompleteQuests.length > 0) {
			hasPrompted.current = true
			openConfirm()
		}
	}, [incompleteQuests.length])

	function handleMoveToToday() {
		moveQuestsToToday()
		closeConfirm()
	}

	return (
		<Stack gap="xs">
			<CalendarScroll />
			{isFromCache && (
				<Text size="xs" c="dimmed" ta="center">Showing cached data — you appear to be offline</Text>
			)}
			<ListQuestsComponent
				quests={questsData}
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
			<Modal opened={confirmOpened} onClose={closeConfirm} title="Overdue tasks" size="sm">
				<Stack>
					<Text size="sm">
						You have {incompleteQuests.length} overdue task{incompleteQuests.length !== 1 ? "s" : ""}. Move them to today?
					</Text>
					<Group justify="flex-end">
						<Button variant="default" onClick={closeConfirm}>Dismiss</Button>
						<Button onClick={handleMoveToToday}>Move to today</Button>
					</Group>
				</Stack>
			</Modal>
		</Stack>
	)
}
