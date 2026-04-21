import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { RouterProvider } from "@tanstack/react-router"
import { QueryClientProvider } from "@tanstack/react-query"
import { router } from "./router"
import { queryClient } from "./lib/query"
import { createTheme, MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';

const theme = createTheme({
	fontFamily: 'Open Sans, sans-serif',
	colors: {
		'ocean-blue': ['#7AD1DD', '#5FCCDB', '#44CADC', '#2AC9DE', '#1AC2D9', '#11B7CD', '#09ADC3', '#0E99AC', '#128797', '#147885'],
	},
	primaryColor: 'ocean-blue',
});

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<MantineProvider theme={theme} defaultColorScheme="dark">
			<QueryClientProvider client={queryClient}>
				<RouterProvider router={router} context={{ queryClient }} />
			</QueryClientProvider>
		</MantineProvider>
	</StrictMode>,
)
