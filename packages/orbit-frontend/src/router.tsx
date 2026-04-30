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
import { ListsPage } from "./pages/lists/lists.page"
import { ListDetailPage } from "./pages/lists/list-details/list-detail.page"
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

function requireAuth({ context, location }: { context: { auth: AuthContext }, location: { href: string } }) {
	if (!context.auth.isLoaded) return
	if (!context.auth.isSignedIn) {
		throw redirect({ to: ROUTES.LOGIN, search: { redirect: location.href } })
	}
}

const homeRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: ROUTES.HOME,
	beforeLoad: requireAuth,
	component: HomePage,
})

const settingsRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: ROUTES.SETTINGS,
	beforeLoad: requireAuth,
	component: SettingsPage,
})

const savesRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: ROUTES.SAVES,
	beforeLoad: requireAuth,
	component: SavesPage,
})

const listsRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: ROUTES.LISTS,
	beforeLoad: requireAuth,
	component: ListsPage,
})

const listDetailRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: ROUTES.LIST_DETAIL,
	beforeLoad: requireAuth,
	component: ListDetailPage,
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
	listsRoute,
	listDetailRoute,
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
