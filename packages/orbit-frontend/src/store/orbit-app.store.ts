import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Quest } from "@/types"

export type PendingQuestPayload = {
	type: Quest["type"]
	title: string
	dueAt?: string | null
	body?: string | null
	startAt?: string | null
	endAt?: string | null
	location?: string | null
	listId?: string
}

export type PendingSavePayload = {
	sourceUrl: string
	note?: string
	listId?: string
}

export type PendingSubmission =
	| { id: string; createdAt: string; apiCallKey: "postQuest"; payload: PendingQuestPayload }
	| { id: string; createdAt: string; apiCallKey: "postSave"; payload: PendingSavePayload }

type OrbitApp = {
	privacyMode: boolean
	pendingSubmissions: PendingSubmission[]
	actions: {
		togglePrivacyMode: () => void
		addPendingSubmission: (submission: PendingSubmission) => void
		removePendingSubmission: (id: string) => void
		clearPendingSubmissions: () => void
	}
}

export const useOrbitAppStore = create<OrbitApp>()(
	persist(
		(set) => ({
			privacyMode: true,
			pendingSubmissions: [],
			actions: {
				togglePrivacyMode: () => set((state) => ({ privacyMode: !state.privacyMode })),
				addPendingSubmission: (submission) =>
					set((state) => ({ pendingSubmissions: [...state.pendingSubmissions, submission] })),
				removePendingSubmission: (id) =>
					set((state) => ({ pendingSubmissions: state.pendingSubmissions.filter((s) => s.id !== id) })),
				clearPendingSubmissions: () => set({ pendingSubmissions: [] }),
			},
		}),
		{
			name: "orbit-app",
			partialize: (state) => ({
				privacyMode: state.privacyMode,
				pendingSubmissions: state.pendingSubmissions,
			}),
		}
	)
)
