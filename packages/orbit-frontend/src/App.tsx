import { AppShell, Center, Loader } from "@mantine/core"
import { useMediaQuery } from "@mantine/hooks"
import { Navigate, Outlet, useRouterState } from "@tanstack/react-router"
import { useAuth } from "@clerk/react"
import "./app.css"
import { AppHeader } from "./components/app-structure/app-header.component"
import { AppFooter } from "./components/app-structure/app-footer.component"
import { AppNavbar } from "./components/app-structure/app-navbar.component"
import { CreateNewComponent } from "./components/create-new-floater/create-new.component"
import { useOrbitAppStore } from "./store/orbit-app.store"
import { useEffect, useState } from "react"
import '@gfazioli/mantine-picker/styles.css';
import '@gfazioli/mantine-scene/styles.css';
import ROUTES from "./routes"

export function App() {
	const { isLoaded, isSignedIn } = useAuth()
	const lastSignedIn = useOrbitAppStore((s) => s.lastSignedIn)
	const setLastSignedIn = useOrbitAppStore((s) => s.actions.setLastSignedIn)
	const [offlineFallback, setOfflineFallback] = useState(false)
	const { location } = useRouterState()
	// Keep lastSignedIn in sync with Clerk's auth state
	useEffect(() => {
		if (isLoaded) setLastSignedIn(!!isSignedIn)
	}, [isLoaded, isSignedIn])

	// If Clerk hasn't loaded after 2s and we're offline, use the cached sign-in state
	useEffect(() => {
		if (isLoaded) return
		const timer = setTimeout(() => {
			if (!navigator.onLine) setOfflineFallback(true)
		}, 2000)
		return () => clearTimeout(timer)
	}, [isLoaded])

	// iOS standalone PWAs compute `100dvh` incorrectly on the first paint (with
	// black-translucent status bar + viewport-fit=cover) and don't correct it until
	// a reflow is forced — which only happens on tall/scrollable pages. That left
	// short pages (home/quests/resurface) with dead space below the fold. Drive the
	// main region's height from the actual measured viewport instead.
	useEffect(() => {
		const setAppHeight = () => {
			document.documentElement.style.setProperty("--app-height", `${window.innerHeight}px`)
		}
		setAppHeight()
		window.addEventListener("resize", setAppHeight)
		window.addEventListener("orientationchange", setAppHeight)
		window.visualViewport?.addEventListener("resize", setAppHeight)
		return () => {
			window.removeEventListener("resize", setAppHeight)
			window.removeEventListener("orientationchange", setAppHeight)
			window.visualViewport?.removeEventListener("resize", setAppHeight)
		}
	}, [])

	// getInitialValueInEffect: false reads synchronously so there's no flash on first render
	const isDesktop = useMediaQuery("(min-width: 48em)", false, { getInitialValueInEffect: false })

	const effectivelyLoaded = isLoaded || offlineFallback
	const effectivelySignedIn = isSignedIn || (offlineFallback && lastSignedIn)

	if (!effectivelyLoaded) {
		return (
			<Center h="100dvh">
				<Loader />
			</Center>
		)
	}

	if (!effectivelySignedIn) {
		if (location.pathname !== ROUTES.LOGIN) {
			return <Navigate to={ROUTES.LOGIN} />
		}
		return <Outlet />
	}

	return (
		<AppShell
			padding={{ base: "sm", sm: "md" }}
			header={{ height: "calc(60px + env(safe-area-inset-top))" }}
			navbar={{ width: 200, breakpoint: "sm", collapsed: { mobile: true } }}
			footer={{ height: 64, collapsed: isDesktop }}
		>
			<AppHeader />
			<AppNavbar />
			<AppShell.Main style={{ minHeight: "var(--app-height, 100dvh)" }}>
				<Outlet />
			</AppShell.Main>
			<AppFooter />
			<CreateNewComponent />
		</AppShell>
	)
}
