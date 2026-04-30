import { useParams } from '@tanstack/react-router'
import { useListDetail } from './use-list-detail.hook'
import { ListDetailView } from './list-detail.view'

export function ListDetailPage() {
	const { id } = useParams({ from: '/lists/$id' })
	const { list, isLoading, onUpdate, onRemoveItem, isUpdating } = useListDetail(id)

	return (
		<ListDetailView
			list={list as any}
			isLoading={isLoading}
			onUpdate={onUpdate}
			onRemoveItem={onRemoveItem}
			isUpdating={isUpdating}
		/>
	)
}
