// router.tsx
import {
	createRouter,
	createRootRouteWithContext,
	createRoute,
	redirect,
} from "@tanstack/react-router"
import type { QueryClient } from "@tanstack/react-query"
import { App } from "./App"
import ROUTES from "./routes"
import { HomePage } from "./pages/home/home"
import { SettingsPage } from "./pages/settings"
import SavesPage from "./pages/saves/saves.page"
import LoginPage from "./pages/auth/login.page"

type AuthContext = {
	isLoaded: boolean
	isSignedIn: boolean
	userId: string | null
}

const rootRoute = createRootRouteWithContext<{
	queryClient: QueryClient
	auth: AuthContext
}>()({
	component: App,
})

const homeRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: ROUTES.HOME,
	component: HomePage,
})

const settingsRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: ROUTES.SETTINGS,
	beforeLoad: ({ context, location }) => {
		if (!context.auth.isLoaded) return

		if (!context.auth.isSignedIn) {
			throw redirect({
				to: ROUTES.LOGIN,
				search: {
					redirect: location.href,
				},
			})
		}
	},
	component: SettingsPage,
})

const savesRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: ROUTES.SAVES,
	beforeLoad: ({ context, location }) => {
		if (!context.auth.isLoaded) return

		if (!context.auth.isSignedIn) {
			throw redirect({
				to: ROUTES.LOGIN,
				search: {
					redirect: location.href,
				},
			})
		}
	},
	component: SavesPage,
})

const loginRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: ROUTES.LOGIN,
	component: LoginPage,
})

const routeTree = rootRoute.addChildren([
	homeRoute,
	settingsRoute,
	savesRoute,
	loginRoute,
])

export const router = createRouter({
	routeTree,
	context: {
		queryClient: undefined!,
		auth: undefined!,
	},
	defaultPreload: "intent",
	defaultPreloadStaleTime: 0,
})

declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router
	}
}
