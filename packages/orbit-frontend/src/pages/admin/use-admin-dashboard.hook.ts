import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { client } from "@orbit/client"
import type { Quest, Save } from "@/types"

// ---------------------------------------------------------------------------
// Quests
// ---------------------------------------------------------------------------
async function fetchAllQuests(): Promise<Quest[]> {
	const all: Quest[] = []
	let cursor: string | undefined = undefined
	while (true) {
		const { data, error } = await client.get({ url: "/quests", query: { limit: 100, ...(cursor ? { cursor } : {}) }, throwOnError: false })
		if (error) throw error
		const page = data as Quest[]
		all.push(...page)
		if (page.length < 100) break
		cursor = page[page.length - 1].createdAt ?? undefined
	}
	return all
}

export function useAdminQuests() {
	return useQuery({
		queryKey: ["admin", "quests"],
		queryFn: fetchAllQuests,
	})
}

export function useArchiveQuests() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: async (ids: string[]) => {
			await Promise.all(ids.map((id) => client.delete({ url: `/quests/${id}`, throwOnError: true })))
		},
		onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "quests"] }),
	})
}

export function useRestoreQuests() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: async (ids: string[]) => {
			await Promise.all(ids.map((id) => client.patch({ url: `/quests/${id}`, body: { status: "active" }, throwOnError: true })))
		},
		onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "quests"] }),
	})
}

// ---------------------------------------------------------------------------
// Saves
// ---------------------------------------------------------------------------
async function fetchAllSaves(): Promise<Save[]> {
	const all: Save[] = []
	let cursor: string | undefined = undefined
	while (true) {
		const { data, error } = await client.get({ url: "/saves", query: { limit: 100, ...(cursor ? { cursor } : {}) }, throwOnError: false })
		if (error) throw error
		const page = data as Save[]
		all.push(...page)
		if (page.length < 100) break
		cursor = page[page.length - 1].createdAt
	}
	return all
}

export function useAdminSaves() {
	return useQuery({
		queryKey: ["admin", "saves"],
		queryFn: fetchAllSaves,
	})
}

export function useDeleteSaves() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: async (ids: string[]) => {
			await Promise.all(ids.map((id) => client.delete({ url: `/saves/${id}`, throwOnError: true })))
		},
		onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "saves"] }),
	})
}

// ---------------------------------------------------------------------------
// User / account
// ---------------------------------------------------------------------------
export type AdminUser = {
	id: string
	name: string
	displayName: string | null
	email: string
	avatar: string | null
	aiModel: "none" | "sarvam" | "haiku"
}

export function useMe() {
	return useQuery({
		queryKey: ["users", "me"],
		queryFn: async () => {
			const { data, error } = await client.get<{ data: AdminUser }>({ url: "/users/me", throwOnError: false })
			if (error) throw error
			return data as AdminUser
		},
	})
}

export function useUpdateModel() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: async (aiModel: string) => {
			const { error } = await client.patch({ url: "/users/me", body: { aiModel }, throwOnError: false })
			if (error) throw error
		},
		onSuccess: () => qc.invalidateQueries({ queryKey: ["users", "me"] }),
	})
}

export function useGetCaptureToken() {
	return useMutation({
		mutationFn: async (rotate: boolean) => {
			const { data, error } = await client.post<{ captureToken: string }>({
				url: "/users/me/capture-token",
				body: { rotate },
				throwOnError: false,
			})
			if (error) throw error
			return (data as { captureToken: string }).captureToken
		},
	})
}
