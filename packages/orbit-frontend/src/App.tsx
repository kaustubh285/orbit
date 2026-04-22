import { AppShell, Burger, Group, ScrollArea } from "@mantine/core"
import { useDisclosure } from "@mantine/hooks"
import { Outlet } from "@tanstack/react-router"
import { TanStackRouterDevtools } from "@tanstack/router-devtools"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import "./app.css"
import { AppHeader } from "./components/app-header.component"
import { AppNavbar } from "./components/app-navbar.component"
export function App() {
	const [mobileOpened, { toggle: toggleMobile }] = useDisclosure()
	const [desktopOpened, { toggle: toggleDesktop }] = useDisclosure(true)

	return (
		<>
			<AppShell
				layout="alt"
				padding={{ base: "sm", sm: "md" }}
				header={{ height: 60 }}
				navbar={{
					width: { sm: 220, lg: 280 },
					breakpoint: "sm",
					collapsed: { mobile: !mobileOpened, desktop: !desktopOpened },
				}}
				transitionDuration={200}
				transitionTimingFunction="ease"
			>

				<AppHeader mobileOpened={mobileOpened} desktopOpened={desktopOpened} toggleMobile={toggleMobile} toggleDesktop={toggleDesktop} />

				<AppNavbar mobileOpened={mobileOpened} toggleMobile={toggleMobile} ScrollArea={ScrollArea} />

				<AppShell.Main>
					<Outlet />
				</AppShell.Main>
			</AppShell>

			{/*<TanStackRouterDevtools position="bottom-right" />
			<ReactQueryDevtools initialIsOpen={false} />*/}
		</>
	)
}
