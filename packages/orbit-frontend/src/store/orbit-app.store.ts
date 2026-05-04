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
	lastSignedIn: boolean
	pendingSubmissions: PendingSubmission[]
	actions: {
		togglePrivacyMode: () => void
		setLastSignedIn: (value: boolean) => void
		addPendingSubmission: (submission: PendingSubmission) => void
		removePendingSubmission: (id: string) => void
		clearPendingSubmissions: () => void
	}
}

export const useOrbitAppStore = create<OrbitApp>()(
	persist(
		(set) => ({
			privacyMode: true,
			lastSignedIn: false,
			pendingSubmissions: [],
			actions: {
				togglePrivacyMode: () => set((state) => ({ privacyMode: !state.privacyMode })),
				setLastSignedIn: (value) => set({ lastSignedIn: value }),
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
				lastSignedIn: state.lastSignedIn,
				pendingSubmissions: state.pendingSubmissions,
			}),
		}
	)
)
