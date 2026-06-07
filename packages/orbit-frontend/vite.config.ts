import { defineConfig, loadEnv } from "vite"
import react from "@vitejs/plugin-react"
import { fileURLToPath, URL } from "node:url"
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), "")
	const apiUrl = env.VITE_API_URL || "http://localhost:9999"

	return {
		plugins: [react(), VitePWA({
			registerType: "autoUpdate",
			workbox: {
				globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
			},
			manifest: {
				name: "Orbit",
				short_name: "Orbit",
				description: "Your personal command centre",
				start_url: "/",
				display: "standalone",
				background_color: "#ffffff",
				theme_color: "#1a1a2e",
				orientation: "portrait",
				icons: [
					{
						src: "/icon-192.png",
						sizes: "192x192",
						type: "image/png",
					},
					{
						src: "/icon-512.png",
						sizes: "512x512",
						type: "image/png",
					},
					{
						src: "/icon-512.png",
						sizes: "512x512",
						type: "image/png",
						purpose: "maskable",
					},
				],
			},
		})],
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
