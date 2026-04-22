/// <reference types="vite/client" />

declare module '*.svg' {
	const content: string
	export default content
}

declare module '*.png' {
	const content: string
	export default content
}

declare module '*.jpg' {
	const content: string
	export default content
}

interface ImportMetaEnv {
	readonly VITE_CLERK_PUBLISHABLE_KEY: string
	// Add more env variables here as needed
}

interface ImportMeta {
	readonly env: ImportMetaEnv
}
