import { useParams } from '@tanstack/react-router'
import { useListDetail } from './use-list-detail.hook'
import { ListDetailView } from './list-detail.view'
import { useQuestsStore } from '@/store/quests.store'
import { QuestModalComponent } from '@/components/quest-modal.component'
import { useHome } from '@/pages/home/use-home.hook'

export function ListDetailPage() {
	const { id } = useParams({ from: '/lists/$id' })
	const { list, isLoading, onUpdate, onRemoveItem, submitQuest, toggleQuest, isUpdating } = useListDetail(id)
	const modalQuest = useQuestsStore((s) => s.modalQuest)
	const { openModal, closeModal } = useQuestsStore((s) => s.actions)
	const { editQuest } = useHome()

	return (
		<>
			<ListDetailView
				list={list as any}
				isLoading={isLoading}
				onUpdate={onUpdate}
				onRemoveItem={onRemoveItem}
				submitQuest={submitQuest}
				toggleQuest={toggleQuest}
				onOpenQuest={openModal}
				isUpdating={isUpdating}
			/>
			<QuestModalComponent
				quest={modalQuest}
				onClose={closeModal}
				onSave={editQuest}
			/>
		</>
	)
}
