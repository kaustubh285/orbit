import { RESURFACE } from "@/lib/utils";
import { postSavesResurfaceMutation } from "@orbit/client";
import type { PostSavesResurfaceResponses } from "@orbit/client";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

type ResurfacedSave = PostSavesResurfaceResponses[200];

type ResurfaceStore = { saves: ResurfacedSave[]; updatedAt: string };

const ONE_HOUR_MS = 1000 * 60 * 60;

const getStore = (): ResurfaceStore =>
	JSON.parse(localStorage.getItem(RESURFACE) ?? '{"saves":[],"updatedAt":""}');

const setStore = (store: ResurfaceStore) =>
	localStorage.setItem(RESURFACE, JSON.stringify(store));

export const useResurface = () => {
	const [saves, setSaves] = useState<ResurfacedSave[]>(() => getStore().saves);

	const mutation = useMutation({
		...postSavesResurfaceMutation(),
		onSuccess: (data) => {
			if (!data || !("id" in data)) return;
			const current = getStore();
			const updated = [...current.saves, data];
			setStore({ saves: updated, updatedAt: new Date().toISOString() });
			setSaves(updated);
		},
	});

	const fetchIfStale = () => {
		const { updatedAt, saves } = getStore();
		const isStale = !updatedAt || Date.now() - new Date(updatedAt).getTime() >= ONE_HOUR_MS;

		console.log("isStale", isStale, "saves.length", saves.length)
		if (isStale || saves.length < 2) mutation.mutate({});
	};

	const resurface = () => mutation.mutate({});

	return { saves, fetchIfStale, resurface, isPending: mutation.isPending, isError: mutation.isError };
};
