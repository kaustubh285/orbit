import { create } from 'zustand';
import type { Quest } from '../types';

type NewQuestDraft = {
	title: string;
	type: Quest["type"];
};

type QuestsState = {
	selectedDate: string;
	modalQuest: Quest | null;
	newQuestDraft: NewQuestDraft;
	actions: {
		setSelectedDate: (date: string) => void;
		openModal: (quest: Quest) => void;
		closeModal: () => void;
		setDraftTitle: (title: string) => void;
		setDraftType: (type: Quest["type"]) => void;
		resetDraft: () => void;
		markQuestComplete: (questId: string) => Quest | undefined;
	};
};

const today = () => new Date().toISOString().split("T")[0];

const emptyDraft: NewQuestDraft = { title: "", type: "todo" };

export const useQuestsStore = create<QuestsState>()((set, get) => ({
	selectedDate: today(),
	modalQuest: null,
	newQuestDraft: { ...emptyDraft },
	actions: {
		setSelectedDate: (date) => set({ selectedDate: date }),
		openModal: (quest) => set({ modalQuest: quest }),
		closeModal: () => set({ modalQuest: null }),
		setDraftTitle: (title) => set((state) => ({ newQuestDraft: { ...state.newQuestDraft, title } })),
		setDraftType: (type) => set((state) => ({ newQuestDraft: { ...state.newQuestDraft, type } })),
		resetDraft: () => set({ newQuestDraft: { ...emptyDraft } }),
		markQuestComplete: (questId) => {
			const quest = get().modalQuest;
			if (!quest || quest.id !== questId) return undefined;
			const now = new Date().toISOString();
			const updated: Quest = {
				...quest,
				status: "completed",
				completedAt: now,
				...(quest.type === "daily" ? { lastCompletedAt: now } : {}),
			};
			set({ modalQuest: updated });
			return updated;
		},
	},
}));
