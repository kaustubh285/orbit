import { client } from "@orbit/client"
import { useQuery } from "@tanstack/react-query"

export type ReportData = {
	questsCompleted: number
	questsIncomplete: number
	questCompletionRate: number
	overdueQuests: number
	savesAdded: number
	savesArchived: number
	aiSummariesGenerated: number
	savesByPlatform: {
		youtube: number
		reddit: number
		instagram: number
		web: number
	}
	topTags: { tag: string; count: number }[]
	topLists: { name: string; savesAdded: number }[]
	notesCreated: number
	notesEdited: number
	activeDays: number
	remembrals: { name: string; date: string }[]
}

export type GeneratedReport = {
	userId: string
	startDate: string
	endDate: string
	generatedAt: string
	data: ReportData
}

export function useReport(startDate: string, endDate: string) {
	return useQuery({
		queryKey: ["report", "in-app", startDate, endDate],
		queryFn: async () => {
			const { data, error } = await client.get<{ data: GeneratedReport }>({
				url: "/report/in-app",
				query: { startDate, endDate },
				throwOnError: false,
			})
			if (error) throw error
			return data as GeneratedReport
		},
		enabled: !!startDate && !!endDate,
	})
}
