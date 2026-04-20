import {
	createRouter,
	createRootRouteWithContext,
	createRoute,
	Outlet,
} from "@tanstack/react-router"
import { TanStackRouterDevtools } from "@tanstack/router-devtools"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import type { QueryClient } from "@tanstack/react-query"
import ROUTES from "./routes"
import { HomePage } from "./pages/home"
import { SettingsPage } from "./pages/settings"

const rootRoute = createRootRouteWithContext<{ queryClient: QueryClient }>()({
	component: () => (
		<>
			<Outlet />
			<TanStackRouterDevtools position="bottom-right" />
			<ReactQueryDevtools initialIsOpen={false} />
		</>
	),
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

const routeTree = rootRoute.addChildren([homeRoute, settingsRoute])

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
