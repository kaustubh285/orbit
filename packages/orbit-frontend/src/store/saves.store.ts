import { create } from 'zustand';

type SavesState = {
	newSaveDraft: { url: string };
	actions: {
		setDraftUrl: (url: string) => void;
		resetDraft: () => void;
	};
};

export const useSavesStore = create<SavesState>()((set) => ({
	newSaveDraft: { url: "" },
	actions: {
		setDraftUrl: (url) => set({ newSaveDraft: { url } }),
		resetDraft: () => set({ newSaveDraft: { url: "" } }),
	},
}));
