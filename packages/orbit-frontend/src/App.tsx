import { AppShell, Center, Loader } from "@mantine/core"
import { Outlet } from "@tanstack/react-router"
import { useAuth } from "@clerk/react"
import "./app.css"
import { AppHeader } from "./components/app-structure/app-header.component"
import { AppFooter } from "./components/app-structure/app-footer.component"
import { CreateNewComponent } from "./components/create-new-floater/create-new.component"
import { useSyncPending } from "./hooks/use-sync-pending.hook"

export function App() {
	const { isLoaded, isSignedIn } = useAuth()
	// useSyncPending()

	if (!isLoaded) {
		return (
			<Center h="100dvh">
				<Loader />
			</Center>
		)
	}

	if (!isSignedIn) {
		return <Outlet />
	}

	return (
		<AppShell
			padding={{ base: "sm", sm: "md" }}
			header={{ height: 60 }}
			footer={{ height: "calc(64px + env(safe-area-inset-bottom))" }}
		>
			<AppHeader />
			<AppShell.Main>
				<Outlet />
			</AppShell.Main>
			<AppFooter />
			<CreateNewComponent />
		</AppShell>
	)
}
