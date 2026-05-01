import { AppShell, Center, Loader } from "@mantine/core"
import { Outlet, useNavigate } from "@tanstack/react-router"
import { useAuth } from "@clerk/react"
import "./app.css"
import { AppHeader } from "./components/app-header.component"
import { AppFooter } from "./components/app-footer.component"
import { CreateNewComponent } from "./components/create-new.component"
import ROUTES from "./routes"

export function App() {
	const { isLoaded, isSignedIn } = useAuth()
	const navigate = useNavigate()

	if (!isSignedIn) {
		navigate({
			to: ROUTES.LOGIN
		})
	}
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
