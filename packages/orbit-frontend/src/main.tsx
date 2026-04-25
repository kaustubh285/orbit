import { StrictMode, useEffect } from "react"
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


const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

const theme = createTheme({
	fontFamily: 'Open Sans, sans-serif',
	colors: {
		'ocean-blue': ['#7AD1DD', '#5FCCDB', '#44CADC', '#2AC9DE', '#1AC2D9', '#11B7CD', '#09ADC3', '#0E99AC', '#128797', '#147885'],
	},
	primaryColor: 'ocean-blue',
});



function AppRouter() {
	const { isLoaded, isSignedIn, userId } = useAuth()

	useEffect(() => {
		router.invalidate()
	}, [isLoaded, isSignedIn])

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
					{/*<RouterProvider router={router} context={{ queryClient }} />*/}
					<AppRouter />
				</QueryClientProvider>

			</ClerkProvider>
		</MantineProvider>
	</StrictMode>,
)
