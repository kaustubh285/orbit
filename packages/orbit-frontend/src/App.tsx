import { AppShell, Center, Loader } from "@mantine/core"
import { Outlet } from "@tanstack/react-router"
import { useAuth } from "@clerk/react"
import "./app.css"
import { AppHeader } from "./components/app-structure/app-header.component"
import { AppFooter } from "./components/app-structure/app-footer.component"
import { CreateNewComponent } from "./components/create-new-floater/create-new.component"
import { useSyncPending } from "./hooks/use-sync-pending.hook"
import { useOrbitAppStore } from "./store/orbit-app.store"
import { useEffect, useState } from "react"

export function App() {
	const { isLoaded, isSignedIn } = useAuth()
	const lastSignedIn = useOrbitAppStore((s) => s.lastSignedIn)
	const setLastSignedIn = useOrbitAppStore((s) => s.actions.setLastSignedIn)
	const [offlineFallback, setOfflineFallback] = useState(false)
	// useSyncPending()

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
