import { PrivacyAwareText } from "@/components/privacy-aware-text.component"
import type { Save } from "@/types"
import {
	ActionIcon,
	Badge,
	Box,
	Button,
	Flex,
	Group,
	Indicator,
	Menu,
	MultiSelect,
	Stack,
	Text,
	TextInput,
	Tooltip,
} from "@mantine/core"
import { useDebouncedValue, useDisclosure } from "@mantine/hooks"
import {
	IconBrandInstagram,
	IconBrandReddit,
	IconBrandYoutube,
	IconCheck,
	IconFilter,
	IconRefresh,
	IconSearch,
	IconWorld,
} from "@tabler/icons-react"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { getSavesOptions } from "@orbit/client"
import { useSaves } from "./use-saves.hook"
import { SaveDetailView } from "@/components/saves/save-fullpage-drawer.component"
import SaveGrid from "@/components/saves/save-grid.component"

dayjs.extend(relativeTime)

type Platform = Save["sourcePlatform"]
type SortOrder = "newest" | "oldest"

const PLATFORM_META: Record<Platform, { label: string; color: string; Icon: React.ElementType }> = {
	youtube: { label: "YouTube", color: "red", Icon: IconBrandYoutube },
	reddit: { label: "Reddit", color: "orange", Icon: IconBrandReddit },
	instagram: { label: "Instagram", color: "grape", Icon: IconBrandInstagram },
	web: { label: "Web", color: "cyan", Icon: IconWorld },
}

const PLATFORM_OPTIONS = [
	{ label: "All platforms", value: "all" },
	{ label: "YouTube", value: "youtube" },
	{ label: "Reddit", value: "reddit" },
	{ label: "Instagram", value: "instagram" },
	{ label: "Web", value: "web" },
]


function collectAllTags(saves: Save[]): string[] {
	const counts = new Map<string, number>()
	for (const s of saves) {
		for (const t of s.tags) counts.set(t, (counts.get(t) ?? 0) + 1)
	}
	return [...counts.entries()]
		.sort((a, b) => b[1] - a[1])
		.map(([tag]) => tag)
}

function collectAllLists(saves: Save[]): string[] {
	const seen = new Set<string>()
	for (const s of saves) {
		for (const l of s.lists ?? []) seen.add(l)
	}
	return [...seen].sort()
}

export default function SavesView({
	saves,
	isLoading,
	onRefetch,
}: {
	saves: Save[]
	isLoading: boolean
	onRefetch?: () => void
}) {
	const [platform, setPlatform] = useState<Platform | "all">("all")
	const [search, setSearch] = useState("")
	const [activeTags, setActiveTags] = useState<string[]>([])
	const [activeLists, setActiveLists] = useState<string[]>([])
	const [sortOrder, setSortOrder] = useState<SortOrder>("newest")

	const [debouncedSearch] = useDebouncedValue(search, 350)

	const searchQuery = useQuery({
		...getSavesOptions({ query: { q: debouncedSearch, limit: 200 } }),
		enabled: !!debouncedSearch,
	})

	const baseSaves = debouncedSearch ? (searchQuery.data as Save[] ?? []) : saves
	const isSearching = !!debouncedSearch && searchQuery.isLoading

	const allTags = collectAllTags(baseSaves)
	const allLists = collectAllLists(baseSaves)

	const filtered = baseSaves
		.filter((s) => {
			const platformMatch = platform === "all" || s.sourcePlatform === platform
			const tagMatch = activeTags.length === 0 || activeTags.some((t) => s.tags.includes(t))
			const listMatch = activeLists.length === 0 || activeLists.some((l) => s.lists?.includes(l))
			return platformMatch && tagMatch && listMatch
		})
		.sort((a, b) => {
			const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
			return sortOrder === "newest" ? -diff : diff
		})

	const [opened, { open, close }] = useDisclosure(false)
	const [selectedSave, setSelectedSave] = useState<Save | null>(null)

	const activeFilterCount =
		(platform !== "all" ? 1 : 0) +
		activeTags.length +
		activeLists.length +
		(sortOrder !== "newest" ? 1 : 0)

	return (
		<Stack gap="md">
			{selectedSave && <SaveDetailView save={selectedSave} opened={opened} onClose={close} />}
			<Group wrap="nowrap" gap="sm">
				<TextInput
					placeholder="Search title, description, notes, platform..."
					leftSection={<IconSearch size={14} />}
					value={search}
					onChange={(e) => setSearch(e.currentTarget.value)}
					style={{ flex: 1 }}
					size="sm"
				/>
				<Menu closeOnItemClick={false} width={280} position="bottom-end">
					<Menu.Target>
						<Indicator label={activeFilterCount} size={16} disabled={activeFilterCount === 0} color="amber">
							<ActionIcon variant="default" size="lg" aria-label="Filters">
								<IconFilter size={16} />
							</ActionIcon>
						</Indicator>
					</Menu.Target>
					<Menu.Dropdown>
						<Menu.Label>Platform</Menu.Label>
						{PLATFORM_OPTIONS.map((opt) => (
							<Menu.Item
								key={opt.value}
								onClick={() => setPlatform(opt.value as Platform | "all")}
								rightSection={platform === opt.value ? <IconCheck size={13} /> : null}
							>
								{opt.label}
							</Menu.Item>
						))}

						<Menu.Divider />
						<Menu.Label>Sort by</Menu.Label>
						<Menu.Item onClick={() => setSortOrder("newest")} rightSection={sortOrder === "newest" ? <IconCheck size={13} /> : null}>
							Newest first
						</Menu.Item>
						<Menu.Item onClick={() => setSortOrder("oldest")} rightSection={sortOrder === "oldest" ? <IconCheck size={13} /> : null}>
							Oldest first
						</Menu.Item>

						{allTags.length > 0 && (
							<>
								<Menu.Divider />
								<Menu.Label>Tags</Menu.Label>
								<Box px="xs" pb="xs">
									<MultiSelect
										placeholder="Filter by tags"
										data={allTags}
										value={activeTags}
										onChange={setActiveTags}
										size="xs"
										clearable
										searchable
										comboboxProps={{ withinPortal: false }}
									/>
								</Box>
							</>
						)}

						{allLists.length > 0 && (
							<>
								<Menu.Divider />
								<Menu.Label>Lists</Menu.Label>
								<Box px="xs" pb="xs">
									<MultiSelect
										placeholder="Filter by list"
										data={allLists}
										value={activeLists}
										onChange={setActiveLists}
										size="xs"
										clearable
										searchable
										comboboxProps={{ withinPortal: false }}
									/>
								</Box>
							</>
						)}
					</Menu.Dropdown>
				</Menu>
				{onRefetch && (
					<Tooltip label="Refresh">
						<ActionIcon variant="subtle" color="gray" onClick={onRefetch} loading={isLoading} size="lg">
							<IconRefresh size={15} />
						</ActionIcon>
					</Tooltip>
				)}
			</Group>

			<SaveGrid
				saves={filtered}
				isLoading={isLoading || isSearching}
				onRefetch={onRefetch}
				onClick={(s) => { setSelectedSave(s); open() }}
			/>

			{!isLoading && !isSearching && filtered.length === 0 && (
				<Text c="dimmed" ta="center" size="sm" mt="xl">
					{debouncedSearch ? "No saves match your search" : platform !== "all" || activeTags.length > 0 ? "No saves match your filters" : "No saves yet"}
				</Text>
			)}
		</Stack>
	)
}
