import { defineConfig, loadEnv } from "vite"
import react from "@vitejs/plugin-react"
import { fileURLToPath, URL } from "node:url"

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), "")
	const apiUrl = env.VITE_API_URL || "http://localhost:9999"

	return {
		plugins: [react()],
		resolve: {
			alias: {
				"@": fileURLToPath(new URL("./src", import.meta.url)),
			},
		},
		server: {
			host: "0.0.0.0",
			proxy: {
				"/api": { target: apiUrl, changeOrigin: true },
				"/doc": { target: apiUrl, changeOrigin: true },
			},
		},
	}
})
