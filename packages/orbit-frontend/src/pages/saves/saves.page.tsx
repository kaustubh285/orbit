import { createTheme, MantineProvider } from "@mantine/core";
import SavesView from "./saves.view";
import { useSaves } from "./use-saves.hook";

const savesTheme = createTheme({ primaryColor: "amber" });

export default function SavesPage() {
	const { saves, isLoading, addSave, isAdding, refetch } = useSaves()
	return (
		<MantineProvider theme={savesTheme}>
			<SavesView saves={saves ?? []} isLoading={isLoading} onAdd={addSave} isAdding={isAdding} onRefetch={refetch} />
		</MantineProvider>
	)
}
