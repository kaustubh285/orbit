import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { RouterProvider } from "@tanstack/react-router"
import { QueryClientProvider } from "@tanstack/react-query"
import { router } from "./router"
import { queryClient } from "./lib/query"
import { createTheme, MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import { ClerkProvider, useAuth } from "@clerk/react"
import { client } from "@orbit/client"

client.setConfig({ baseUrl: import.meta.env.VITE_API_URL || "http://localhost:9999" })

// Module-level token getter — updated during render so it's always current
// before any effects (including React Query's initial fetch) fire.
let _getToken: (() => Promise<string | null>) | null = null

client.interceptors.request.use(async (request) => {
	if (_getToken) {
		const token = await _getToken()
		if (token) request.headers.set("Authorization", `Bearer ${token}`)
	}
	return request
})

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

const theme = createTheme({
	fontFamily: 'Open Sans, sans-serif',
	colors: {
		'ocean-blue': ['#7AD1DD', '#5FCCDB', '#44CADC', '#2AC9DE', '#1AC2D9', '#11B7CD', '#09ADC3', '#0E99AC', '#128797', '#147885'],
		'amber': ['#fff8e1', '#ffecb3', '#ffe082', '#ffd54f', '#ffca28', '#ffc107', '#ffb300', '#ffa000', '#ff8f00', '#ff6f00'],
	},
	primaryColor: 'ocean-blue',
});

function AppRouter() {
	const { isLoaded, isSignedIn, userId, getToken } = useAuth()

	// Update module-level getter during render — happens before any effects run,
	// so React Query's initial fetch always has a token getter available.
	_getToken = isSignedIn ? getToken : null

	return (
		<RouterProvider
			router={router}
			context={{
				queryClient,
				auth: {
					isLoaded,
					isSignedIn: !!isSignedIn,
					userId: userId ?? null,
				},
			}}
		/>
	)
}

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<MantineProvider theme={theme} defaultColorScheme="dark">
			<ClerkProvider publishableKey={clerkPubKey || ""}>
				<QueryClientProvider client={queryClient}>
					<AppRouter />
				</QueryClientProvider>
			</ClerkProvider>
		</MantineProvider>
	</StrictMode>,
)
