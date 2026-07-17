import type { Save } from "@/types";
import { postAiQueryMutation } from "@orbit/client";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

export type SearchResult = Save & { reason: string };

export function useHomeSearch() {
	const [searchTerm, setSearchTerm] = useState("");
	const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
	const [interpretation, setInterpretation] = useState<string | null>(null);

	const mutation = useMutation({
		...postAiQueryMutation(),
		onSuccess: (data) => {
			setInterpretation(data.interpretation);
			setSearchResults(data.results as SearchResult[]);
		},
	});

	// `override` lets the intent chips search their canned phrase immediately,
	// instead of racing the setSearchTerm state update before reading it back.
	const handleSearch = (override?: string) => {
		const query = (override ?? searchTerm).trim();
		if (!query) {
			clearSearch();
			return;
		}
		mutation.mutate({ body: { query } });
	};

	const clearSearch = () => {
		setSearchTerm("");
		setSearchResults([]);
		setInterpretation(null);
	};

	return {
		searchTerm,
		setSearchTerm,
		searchResults,
		setSearchResults,
		interpretation,
		handleSearch,
		clearSearch,
		isSearching: mutation.isPending,
	};
}
