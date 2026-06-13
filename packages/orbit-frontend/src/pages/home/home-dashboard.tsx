import ROUTES from "@/routes"
import type { Save } from "@/types"
import { Box, Button, Group, ScrollArea, SimpleGrid, Stack, Text } from "@mantine/core"
import {
	IconBookmark,
	IconBrandInstagram,
	IconBrandReddit,
	IconBrandYoutube,
	IconChartBar,
	IconFileText,
	IconList,
	IconPlus,
	IconRocket,
	IconTimeline,
	IconWorld,
} from "@tabler/icons-react"
import { useNavigate } from "@tanstack/react-router"
import { useOrbitAppStore } from "@/store/orbit-app.store"
import { useSaves } from "../saves/use-saves.hook"
import { client, getQuestsOptions } from "@orbit/client"
import { useQuery } from "@tanstack/react-query"
import { PrivacyAwareText } from "@/components/privacy-aware-text.component"
import { CachedItems } from "@/components/app-structure/cached-items.component"
import { useState } from "react"

const NAV_CARDS = [
	{ label: "Quests", description: "Todos, events & dailies", icon: IconRocket, to: ROUTES.QUESTS, accent: "ocean-blue", shade: 4 },
	{ label: "Notes", description: "Your notes & docs", icon: IconFileText, to: ROUTES.NOTES, accent: "gray", shade: 4 },
	{ label: "Saves", description: "Bookmarks & links", icon: IconBookmark, to: ROUTES.SAVES, accent: "amber", shade: 5 },
	{ label: "Lists", description: "Organised collections", icon: IconList, to: ROUTES.LISTS, accent: "violet", shade: 5 },
	{ label: "Timeline", description: "Memories over time", icon: IconTimeline, to: ROUTES.TIMELINE, accent: "pink", shade: 4 },
]

const PLATFORM_META: Record<Save["sourcePlatform"], { color: string; hex: string; Icon: React.ElementType }> = {
	youtube: { color: "red", hex: "#e03131", Icon: IconBrandYoutube },
	reddit: { color: "orange", hex: "#e8590c", Icon: IconBrandReddit },
	instagram: { color: "grape", hex: "#9c36b5", Icon: IconBrandInstagram },
	web: { color: "cyan", hex: "#0c8599", Icon: IconWorld },
}

function RecentSaveCard({ save }: { save: Save }) {
	const navigate = useNavigate()
	const { privacyMode } = useOrbitAppStore()
	const meta = PLATFORM_META[privacyMode ? "web" : save.sourcePlatform]
	const PlatformIcon = meta.Icon


	return (
		<PrivacyAwareText
			component="a"
			href={save.sourceUrl}
			target="_blank"
			rel="noopener noreferrer"
			style={{
				position: "relative",
				width: 140,
				height: 110,
				flexShrink: 0,
				borderRadius: 10,
				overflow: "hidden",
				cursor: "pointer",
				background: save.thumbnailUrl
					? `url(${save.thumbnailUrl}) center/cover no-repeat`
					: `linear-gradient(135deg, ${meta.hex}55, ${meta.hex}99)`,
				border: "1px solid var(--mantine-color-dark-4)",
			}}
		>
			{/* Gradient overlay */}
			<Box
				style={{
					position: "absolute",
					inset: 0,
					background: "linear-gradient(to top, rgba(0,0,0,0.82) 55%, rgba(0,0,0,0.15) 100%)",
				}}
			/>

			{/* Platform icon top-right */}
			<Box style={{ position: "absolute", top: 7, right: 7 }}>
				<PlatformIcon size={13} color="rgba(255,255,255,0.7)" />
			</Box>

			{/* Title bottom */}
			<Box style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "0 8px 8px" }}>
				<PrivacyAwareText
					size="xs"
					fw={600}
					lineClamp={2}
					style={{ color: "#fff", lineHeight: 1.3, fontSize: 11 }}
				>
					{save.title ?? save.sourceUrl}
				</PrivacyAwareText>
			</Box>
		</PrivacyAwareText>
	)
}

function RecentSaveCardSkeleton() {
	return (
		<Box
			style={{
				width: 140,
				height: 110,
				flexShrink: 0,
				borderRadius: 10,
				background: "var(--mantine-color-dark-6)",
				border: "1px solid var(--mantine-color-dark-4)",
				animation: "pulse 1.5s ease-in-out infinite",
			}}
		/>
	)
}

function NavCard({
	label,
	description,
	icon: Icon,
	to,
	accent,
	shade,
}: (typeof NAV_CARDS)[number]) {
	const navigate = useNavigate()
	const color = `var(--mantine-color-${accent}-${shade})`

	return (
		<Box
			onClick={() => navigate({ to })}
			style={{
				borderRadius: 12,
				border: "1px solid var(--mantine-color-dark-4)",
				borderTop: `3px solid ${color}`,
				padding: "16px",
				background: "var(--mantine-color-dark-7)",
				cursor: "pointer",
				transition: "background 0.12s ease",
			}}
			onMouseEnter={(e) => { e.currentTarget.style.background = "var(--mantine-color-dark-6)" }}
			onMouseLeave={(e) => { e.currentTarget.style.background = "var(--mantine-color-dark-7)" }}
		>
			<Stack gap={8}>
				<Icon size={28} color={color} stroke={1.5} />
				<Stack gap={2}>
					<Text fw={600} size="sm">{label}</Text>
					<Text size="xs" c="dimmed">{description}</Text>
				</Stack>
			</Stack>
		</Box>
	)
}

function useDashboardStats() {
	const today = new Date().toISOString().split("T")[0]
	const yesterday = new Date(Date.now() - 86_400_000).toISOString().split("T")[0]

	const todayQuests = useQuery(getQuestsOptions({ query: { date: today } }))?.data?.filter((q) => q.type !== "note") ?? []
	const yesterdayQuests = useQuery(getQuestsOptions({ query: { date: yesterday } }))?.data?.filter((q) => q.type !== "note") ?? []
	return {
		dueToday: todayQuests.filter((q) => q.status === "active").length,
		completedToday: todayQuests.filter((q) => q.status === "completed").length,
		overdue: yesterdayQuests.filter((q) => q.status === "active").length,
	}
}

function InsightCard({ label, value }: { label: string; value: number | string }) {
	return (
		<Box
			style={{
				borderRadius: 10,
				border: "1px solid var(--mantine-color-dark-4)",
				padding: "14px 16px",
				background: "var(--mantine-color-dark-7)",
			}}
		>
			<Stack gap={4}>
				<Text size="xs" c="dimmed">{label}</Text>
				<PrivacyAwareText fw={700} size="xl">{value}</PrivacyAwareText>
			</Stack>
		</Box>
	)
}

type BackfillResult = { updated: number; failed: number; skipped: number }

export function HomeDashboard() {
	const setCreateNewOpen = useOrbitAppStore((s) => s.actions.setCreateNewOpen)
	const { mostRecentFiveSaves, mostRecentFiveSavesIsLoading } = useSaves()
	const { dueToday, completedToday, overdue } = useDashboardStats()
	const navigate = useNavigate()
	const [isBackfilling, setIsBackfilling] = useState(false)
	const [backfillResult, setBackfillResult] = useState<BackfillResult | null>(null)

	async function runBackfill() {
		setIsBackfilling(true)
		setBackfillResult(null)
		try {
			const { data } = await client.post<BackfillResult>({ url: "/saves/backfill", throwOnError: false })
			if (data) setBackfillResult(data)
		} finally {
			setIsBackfilling(false)
		}
	}

	return (
		<Stack gap="xl" pt="sm">
			<Group justify="space-between" align="flex-end">
				<Stack gap={2}>
					<Text fw={700} size="xl">Orbit</Text>
					<Text size="sm" c="dimmed">Your personal command centre</Text>
				</Stack>
				<Group gap="xs">
					{/* TEMP — remove after running once */}
					<Button
						size="sm"
						variant="subtle"
						color="orange"
						loading={isBackfilling}
						onClick={runBackfill}
					>
						{backfillResult
							? `✓ ${backfillResult.updated} fixed, ${backfillResult.failed} failed`
							: "Backfill saves"}
					</Button>
					<Button
						leftSection={<IconChartBar size={14} />}
						size="sm"
						variant="subtle"
						color="gray"
						onClick={() => navigate({ to: ROUTES.REPORT })}
					>
						Report
					</Button>
					<Button
						leftSection={<IconPlus size={14} />}
						size="sm"
						onClick={() => setCreateNewOpen(true)}
					>
						New
					</Button>
				</Group>
			</Group>

			<CachedItems />


			{/* Insights */}
			<Stack gap="xs">
				<Text size="xs" c="dimmed" tt="uppercase" fw={600} style={{ letterSpacing: "0.08em" }}>Today</Text>
				<Group grow>
					<InsightCard label="Due today" value={dueToday} />
					<InsightCard label="Completed" value={completedToday} />
					<InsightCard label="Overdue" value={overdue} />
				</Group>
			</Stack>

			{/* Recent saves */}
			<Stack gap="xs">
				<Text size="xs" c="dimmed" tt="uppercase" fw={600} style={{ letterSpacing: "0.08em" }}>
					Recent saves
				</Text>
				<ScrollArea scrollbarSize={4} type="scroll">
					<Group gap="xs" wrap="nowrap" pb={4}>
						{mostRecentFiveSavesIsLoading
							? [1, 2, 3, 4, 5].map((i) => <RecentSaveCardSkeleton key={i} />)
							: (mostRecentFiveSaves ?? []).map((save) => (
								<RecentSaveCard key={save.id} save={save} />
							))
						}
					</Group>
				</ScrollArea>
			</Stack>

			{/* Navigation cards */}
			<Stack gap="xs">
				<Text size="xs" c="dimmed" tt="uppercase" fw={600} style={{ letterSpacing: "0.08em" }}>Go to</Text>
				<SimpleGrid cols={{ base: 2, sm: 3 }} spacing="sm">
					{NAV_CARDS.map((card) => (
						<NavCard key={card.to} {...card} />
					))}
				</SimpleGrid>
			</Stack>
		</Stack>
	)
}
