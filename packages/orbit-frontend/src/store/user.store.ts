import { create } from 'zustand';

type User = {
	id: string;
	name: string | null;
	displayName: string | null;
	bio: string | null;
	email: string | null;
	lastLoginAt: string | null;
	avatar: string | null;
	clerkUUID: string | null;
};

type UserState = {
	user: User;
	actions: {
		setUser: (user: User) => void;
		updateUser: (patch: Partial<User>) => void;
		resetUser: () => void;
	};
};

const emptyUser: User = {
	id: "",
	name: null,
	displayName: null,
	bio: null,
	email: null,
	lastLoginAt: null,
	avatar: null,
	clerkUUID: null,
};

export const useUserStore = create<UserState>()((set) => ({
	user: { ...emptyUser },
	actions: {
		setUser: (user) => set({ user }),
		updateUser: (patch) => set((state) => ({ user: { ...state.user, ...patch } })),
		resetUser: () => set({ user: { ...emptyUser } }),
	},
}));
