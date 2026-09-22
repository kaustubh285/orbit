import { useRouter, useSearch } from "@tanstack/react-router"

export function useSaveDrawer() {
	const router = useRouter()
	const search = useSearch({ strict: false }) as { save?: string }

	const open = (id: string) => {
		const params = new URLSearchParams(window.location.search)
		params.set("save", id)
		router.history.push(`${window.location.pathname}?${params.toString()}`)
	}

	const close = () => {
		const params = new URLSearchParams(window.location.search)
		params.delete("save")
		const qs = params.toString()
		router.history.replace(`${window.location.pathname}${qs ? `?${qs}` : ""}`)
	}

	return { saveId: search.save ?? null, open, close }
}
