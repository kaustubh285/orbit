import { useNavigate, useSearch } from "@tanstack/react-router"

export function useSaveDrawer() {
	const navigate = useNavigate()
	const search = useSearch({ strict: false }) as { save?: string }

	// Cast away strict search types — root route has no validateSearch, so
	// TanStack Router doesn't know about the `save` param at compile time.
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const nav = navigate as (opts: any) => Promise<void>

	const open = (id: string) =>
		nav({
			search: (prev: Record<string, unknown>) => ({ ...prev, save: id }),
			resetScroll: false,
		})

	const close = () =>
		nav({
			search: (prev: Record<string, unknown>) => { const { save: _, ...rest } = prev; return rest },
			resetScroll: false,
			replace: true,
		})

	return { saveId: search.save ?? null, open, close }
}
