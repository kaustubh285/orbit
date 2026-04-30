import SavesView from "./saves.view";
import { useSaves } from "./use-saves.hook";

export default function SavesPage() {
	const { saves, isLoading, addSave, isAdding, refetch } = useSaves()
	return (
		<SavesView saves={saves ?? []} isLoading={isLoading} onAdd={addSave} isAdding={isAdding} onRefetch={refetch} />
	)
}
