import { AppShell } from "@mantine/core"
import { Outlet } from "@tanstack/react-router"
import "./app.css"
import { AppHeader } from "./components/app-header.component"
import { AppFooter } from "./components/app-footer.component"

export function App() {
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
