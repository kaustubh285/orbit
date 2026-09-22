import { getSavesByIdOptions } from "@orbit/client"
import { useQuery } from "@tanstack/react-query"
import { SaveDetailView } from "./save-fullpage-drawer.component"
import type { Save } from "@/types"
import { Center, Drawer, Loader } from "@mantine/core"
import { useMediaQuery } from "@mantine/hooks"
import { useSaveDrawer } from "@/hooks/use-save-drawer"

function GlobalSaveDrawerInner({ id }: { id: string }) {
	const { close } = useSaveDrawer()
	const isDesktop = useMediaQuery("(min-width: 48em)", false, { getInitialValueInEffect: false })

	const { data: save, isLoading } = useQuery({
		...getSavesByIdOptions({ path: { id } }),
		enabled: !!id,
	})

	if (isLoading || !save) {
		return (
			<Drawer
				position={isDesktop ? "right" : "bottom"}
				opened={true}
				onClose={close}
				size="xl"
				withCloseButton={false}
				padding={0}
				radius="md"
			>
				<Center h="100%">
					<Loader size="sm" />
				</Center>
			</Drawer>
		)
	}

	return <SaveDetailView save={save as Save} opened={true} onClose={close} />
}

export function GlobalSaveDrawer() {
	const { saveId } = useSaveDrawer()
	if (!saveId) return null
	return <GlobalSaveDrawerInner id={saveId} />
}
