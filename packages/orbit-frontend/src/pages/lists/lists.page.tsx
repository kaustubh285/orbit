import { ListsView } from './lists.view'
import { useLists } from './use-lists.hook'

export function ListsPage() {
	const { lists, isLoading, onCreate, onUpdate, onDelete, isCreating } = useLists()

	return (
		<ListsView
			lists={lists}
			isLoading={isLoading}
			onCreate={onCreate}
			onUpdate={onUpdate}
			onDelete={onDelete}
			isCreating={isCreating}
		/>
	)
}
