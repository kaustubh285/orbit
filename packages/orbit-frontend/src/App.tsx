import { AppShell, Center, Loader } from "@mantine/core"
import { Outlet } from "@tanstack/react-router"
import { useAuth } from "@clerk/react"
import "./app.css"
import { AppHeader } from "./components/app-header.component"
import { AppFooter } from "./components/app-footer.component"

export function App() {
	const { isLoaded } = useAuth()

	if (!isLoaded) {
		return (
			<Center h="100dvh">
				<Loader />
			</Center>
		)
	}

	return (
		<AppShell
			padding={{ base: "sm", sm: "md" }}
			header={{ height: 60 }}
			footer={{ height: 64 }}
		>
			<AppHeader />
			<AppShell.Main>
				<Outlet />
			</AppShell.Main>
			<AppFooter />
		</AppShell>
	)
}
