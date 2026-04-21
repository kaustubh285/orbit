import { createRouter, createRootRouteWithContext, createRoute } from "@tanstack/react-router"
import type { QueryClient } from "@tanstack/react-query"
import { App } from "./App"
import ROUTES from "./routes"
import { HomePage } from "./pages/home/home"
import { SettingsPage } from "./pages/settings"
import SavesPage from "./pages/saves/saves.page"

const rootRoute = createRootRouteWithContext<{ queryClient: QueryClient }>()({
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
	component: SettingsPage,
})

const savesRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: ROUTES.SAVES,
	component: SavesPage,
})

const routeTree = rootRoute.addChildren([homeRoute, settingsRoute, savesRoute])

export const router = createRouter({
	routeTree,
	context: { queryClient: undefined! },
	defaultPreload: "intent",
	defaultPreloadStaleTime: 0,
})

declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router
	}
}
