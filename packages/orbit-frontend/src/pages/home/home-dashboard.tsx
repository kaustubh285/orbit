import type { Save } from "@/types"
import { ActionIcon, Box, Button, Grid, Group, ScrollArea, Stack, Text, Textarea } from "@mantine/core"
import {
	IconBrandInstagram,
	IconBrandReddit,
	IconBrandYoutube,
	IconCheck,
	IconSearch,
	IconWorld,
	IconX,
} from "@tabler/icons-react"
import { useQueue } from "./use-queue.hook"
import { useOrbitAppStore } from "@/store/orbit-app.store"
import { useSaves } from "../saves/use-saves.hook"
import { getQuestsOptions } from "@orbit/client"
import { useQuery } from "@tanstack/react-query"
import { PrivacyAwareText } from "@/components/privacy-aware-text.component"

import { useHomeSearch } from "./use-home-search.hook"
import { useSaveDrawer } from "@/hooks/use-save-drawer"
import { getThumbnailUrl } from "@/lib/thumbnail"

// Topical chips only — each is a canned query through the same pipeline as free
// text, so they only work as well as the keyword/summary data behind them.
// Mood/duration chips ("bored", "30-40 min") are intentionally omitted: they
// filter on duration/contentType, which aren't queryable columns yet.
const INTENT_CHIPS = [
	{ label: "Cooking tonight", query: "recipe dinner cooking", color: "teal" },
	{ label: "Learn something new", query: "tutorial explainer how it works", color: "lime" },
	{ label: "Watch a movie/series", query: "movie series show to watch", color: "grape" },
	{ label: "Travel & places", query: "travel trip city places", color: "blue" },
] as const

const PLATFORM_META: Record<Save["sourcePlatform"], { color: string; hex: string; Icon: React.ElementType }> = {
	youtube: { color: "red", hex: "#e03131", Icon: IconBrandYoutube },
	reddit: { color: "orange", hex: "#e8590c", Icon: IconBrandReddit },
	instagram: { color: "grape", hex: "#9c36b5", Icon: IconBrandInstagram },
	web: { color: "cyan", hex: "#0c8599", Icon: IconWorld },
}

function RecentSaveCard({ save, onClick }: { save: Save; onClick: () => void }) {
	const { privacyMode } = useOrbitAppStore()
	const meta = PLATFORM_META[privacyMode ? "web" : save.sourcePlatform]
	const PlatformIcon = meta.Icon


	return (
		<PrivacyAwareText
			component="button"
			onClick={onClick}
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
					? `url(${getThumbnailUrl(save.thumbnailUrl)}) center/${save.sourcePlatform === "instagram" ? "contain" : "cover"} no-repeat`
					: `linear-gradient(135deg, ${meta.hex}55, ${meta.hex}99)`,
				backgroundColor: save.thumbnailUrl && save.sourcePlatform === "instagram" ? `${meta.hex}33` : undefined,
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
					{save.aiTitle ?? save.title ?? save.sourceUrl}
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

function SearchResultCard({ save, reason, onClick }: { save: Save; reason: string; onClick: () => void }) {
	const { privacyMode } = useOrbitAppStore()
	const meta = PLATFORM_META[privacyMode ? "web" : save.sourcePlatform]
	const PlatformIcon = meta.Icon

	return (
		<Box
			component="button"
			onClick={onClick}
			style={{
				display: "flex",
				gap: 12,
				width: "100%",
				textAlign: "left",
				alignItems: "flex-start",
				padding: "12px 14px",
				borderRadius: 10,
				cursor: "pointer",
				background: "var(--mantine-color-dark-7)",
				border: "1px solid var(--mantine-color-dark-4)",
			}}
		>
			<Box
				style={{
					width: 56,
					height: 56,
					flexShrink: 0,
					borderRadius: 8,
					background: save.thumbnailUrl && !privacyMode
						? `url(${getThumbnailUrl(save.thumbnailUrl)}) center/cover no-repeat`
						: `linear-gradient(135deg, ${meta.hex}55, ${meta.hex}99)`,
				}}
			/>
			<Stack gap={4} style={{ minWidth: 0, flex: 1 }}>
				<Group gap={6} wrap="nowrap">
					<PlatformIcon size={13} color={meta.hex} style={{ flexShrink: 0 }} />
					<PrivacyAwareText size="sm" fw={600} lineClamp={1}>
						{save.aiTitle ?? save.title ?? save.sourceUrl}
					</PrivacyAwareText>
				</Group>
				{reason && (
					<Text size="xs" c="dimmed" lineClamp={2}>{reason}</Text>
				)}
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

function QueueItem({ id, save, onRemove, onOpen }: { id: string; save: Save; onRemove: (id: string) => void; onOpen: (id: string) => void }) {
	const { privacyMode } = useOrbitAppStore()
	const meta = PLATFORM_META[privacyMode ? "web" : save.sourcePlatform]
	const PlatformIcon = meta.Icon

	return (
		<Group
			gap={12}
			wrap="nowrap"
			style={{
				padding: "10px 12px",
				borderRadius: 10,
				background: "var(--mantine-color-dark-7)",
				border: "1px solid var(--mantine-color-dark-4)",
				cursor: "pointer",
			}}
			onClick={() => onOpen(save.id)}
		>
			<Box
				style={{
					width: 56,
					height: 56,
					flexShrink: 0,
					borderRadius: 8,
					background: save.thumbnailUrl && !privacyMode
						? `url(${getThumbnailUrl(save.thumbnailUrl)}) center/${save.sourcePlatform === "instagram" ? "contain" : "cover"} no-repeat`
						: `linear-gradient(135deg, ${meta.hex}55, ${meta.hex}99)`,
					backgroundColor: save.thumbnailUrl && !privacyMode && save.sourcePlatform === "instagram" ? `${meta.hex}33` : undefined,
				}}
			/>
			<Stack gap={3} style={{ minWidth: 0, flex: 1 }}>
				<Group gap={5} wrap="nowrap">
					<PlatformIcon size={12} color={meta.hex} style={{ flexShrink: 0 }} />
					<PrivacyAwareText size="xs" c="dimmed" style={{ flexShrink: 0 }}>
						{save.author ?? save.sourcePlatform}
					</PrivacyAwareText>
				</Group>
				<PrivacyAwareText size="sm" fw={600} lineClamp={2} style={{ lineHeight: 1.3 }}>
					{save.aiTitle ?? save.title ?? save.sourceUrl}
				</PrivacyAwareText>
			</Stack>
			<ActionIcon
				variant="light"
				color="teal"
				size="md"
				radius="xl"
				style={{ flexShrink: 0 }}
				onClick={(e) => { e.stopPropagation(); onRemove(id) }}
				title="Mark as watched"
			>
				<IconCheck size={15} />
			</ActionIcon>
		</Group>
	)
}

export function HomeDashboard() {
	const { mostRecentFiveSaves, mostRecentFiveSavesIsLoading } = useSaves()
	const { dueToday, completedToday, overdue } = useDashboardStats()
	const { items: queueItems, isLoading: queueLoading, removeItem } = useQueue()
	const { open: openSaveDrawer } = useSaveDrawer()

	const { searchTerm, setSearchTerm, searchResults, interpretation, handleSearch, clearSearch, isSearching } = useHomeSearch()

	return (
		<Stack gap="md" pt="sm" mih="100dvh">
			{
				!searchResults.length && !isSearching && (
					<>
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
											<RecentSaveCard key={save.id} save={save} onClick={() => openSaveDrawer(save.id)} />
										))
									}
								</Group>
							</ScrollArea>
						</Stack>

						{/* Insights */}
						<Stack gap="xs">
							<Text size="xs" c="dimmed" tt="uppercase" fw={600} style={{ letterSpacing: "0.08em" }}>Today</Text>
							<Group grow>
								<InsightCard label="Due today" value={dueToday} />
								<InsightCard label="Completed" value={completedToday} />
								<InsightCard label="Overdue" value={overdue} />
							</Group>
						</Stack>
					</>
				)
			}

			{/* Queue */}
			{(queueLoading || queueItems.length > 0) && (
				<Stack gap="xs">
					<Text size="xs" c="dimmed" tt="uppercase" fw={600} style={{ letterSpacing: "0.08em" }}>
						Up next
					</Text>
					{queueLoading
						? [1, 2].map((i) => (
							<Box
								key={i}
								style={{
									height: 76,
									borderRadius: 10,
									background: "var(--mantine-color-dark-6)",
									border: "1px solid var(--mantine-color-dark-4)",
									animation: "pulse 1.5s ease-in-out infinite",
								}}
							/>
						))
						: queueItems.map((item) => (
							<QueueItem key={item.id} id={item.id} save={item.save as Save} onRemove={removeItem} onOpen={openSaveDrawer} />
						))
					}
				</Stack>
			)}

			{/* Command Centre */}
			{/* <Group justify="space-between" align="flex-end">
				<Stack gap={2}>
					<Text size="md" ff="monospace">Command Centre</Text>
				</Stack>
			</Group> */}

			{/*
				Works well:

				  - Topical: "Mexican recipes", "machine learning papers", "travel guides to
				  Japan" — Stage A expands these into synonyms, ILIKE matches across title,
				  description, summary, tags
				  - Vague memory: "that video about how CPUs work", "the article I saved
				  about productivity" — the keyword expansion handles approximate recall
				  - Platform-specific: "YouTube tutorials about X", "Reddit posts about Y" —
				  Stage A extracts the platform, Stage B now applies it as a hard filter
				  (that was the bug we just fixed)
				  - Intent/mood: "something to watch tonight", "I want to learn about
				  investing" — falls back to broad keywords like "entertaining", "finance"
				  - Your notes: if you added a personal note when saving ("save note: need
				  this for the project"), that's searched
				  - Tags and lists: "stuff I tagged with Python", "things in my cooking
				  list" — the reranker sees list names and tags

				  Won't work well:

				  - Date queries: "things I saved last month" — Stage A doesn't extract
				  dates, there's no date WHERE clause in Stage B
				  - Content type filtering: "only show tutorials" — contentType lives inside
				  the aiSummary JSON blob, not a queryable column. Keywords like "tutorial"
				  will still match as text though
				  - Author search: "videos by Fireship" — author field isn't in the ILIKE
				  conditions in Stage B (it's also not passed to the reranker)
				  - Negation: "recipes but not Indian" — keyword OR logic can't exclude
				  - Quantity queries: "short videos under 10 minutes" — no duration column
				*/}
			<Group>
				<Textarea rows={1} autosize placeholder="What are you looking for?" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onBlur={() => handleSearch()} flex={1} rightSection={searchTerm ? <IconX size={18} style={{ cursor: "pointer" }} onClick={() => clearSearch()} /> : null} />
				<ActionIcon onClick={() => handleSearch()} size="lg" loading={isSearching}><IconSearch size={18} /></ActionIcon>
			</Group>

			{isSearching && (
				<Text size="sm" c="dimmed">Searching your saves…</Text>
			)}

			{!isSearching && searchResults.length > 0 && (
				<Stack gap="xs">
					<Group justify="space-between" align="flex-start" wrap="nowrap">
						{interpretation && <Text size="xs" c="dimmed" style={{ flex: 1 }} lineClamp={2}>{interpretation}</Text>}
						<Button variant="subtle" size="compact-xs" onClick={clearSearch}>Clear</Button>
					</Group>
					{searchResults.map((save) => (
						<SearchResultCard key={save.id} save={save} reason={save.reason} onClick={() => openSaveDrawer(save.id)} />
					))}
				</Stack>
			)}

			{!isSearching && searchResults.length === 0 && interpretation && (
				<Stack gap="xs">
					<Text size="sm" c="dimmed">{interpretation}</Text>
					<Text size="xs" c="dimmed">No matches found — try different words.</Text>
					<Button variant="subtle" size="compact-xs" onClick={clearSearch} w="fit-content">Clear</Button>
				</Stack>
			)}

			{/* Intent chips — hidden once a search is in flight or has results */}
			{!isSearching && searchResults.length === 0 && !interpretation && (
				<Grid>
					{INTENT_CHIPS.map((chip) => (
						<Grid.Col span={6} key={chip.label}>
							<Button
								h="100%"
								fullWidth
								variant="light"
								color={chip.color}
								radius="lg"
								onClick={() => { setSearchTerm(chip.query); handleSearch(chip.query) }}
								styles={{ label: { whiteSpace: "normal", textAlign: "center", lineHeight: 1.3 }, root: { height: "auto", padding: "10px 12px" } }}
							>
								{chip.label}
							</Button>
						</Grid.Col>
					))}
				</Grid>
			)}
		</Stack>
	)
}
