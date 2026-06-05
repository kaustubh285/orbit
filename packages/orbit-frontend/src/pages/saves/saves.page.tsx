import SavesView from "./saves.view";
import { useSaves } from "./use-saves.hook";

export default function SavesPage() {
	const { saves, isLoading, refetch } = useSaves()
	return (
		<SavesView saves={saves ?? []} isLoading={isLoading} onRefetch={refetch} />
	)
}
