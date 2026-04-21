import SavesView from "./saves.view";
import { useSaves } from "./use-saves.hook";

export default function SavesPage() {
	const { } = useSaves()

	return (
		<SavesView />
	)
}
