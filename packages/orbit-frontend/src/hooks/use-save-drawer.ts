import { useNavigate, useSearch } from "@tanstack/react-router"

export function useSaveDrawer() {
	const navigate = useNavigate()
	const { save: saveId } = useSearch({ strict: false })

	const open = (id: string) =>
		navigate({ search: (prev) => ({ ...prev, save: id }), replace: false })

	const close = () =>
		navigate({ search: (prev) => { const { save: _, ...rest } = prev; return rest }, replace: true })

	return { saveId: saveId ?? null, open, close }
}
