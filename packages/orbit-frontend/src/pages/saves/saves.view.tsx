import { PrivacyAwareText } from "@/components/privacy-aware-text.component"
import { UpdateSaveModal } from "@/components/saves/update-save-modal.component"
import type { Save } from "@/types"
import {
	ActionIcon,
	Badge,
	Box,
	Button,
	Card,
	Flex,
	Group,
	Indicator,
	Menu,
	MultiSelect,
	SimpleGrid,
	Skeleton,
	Stack,
	Text,
	TextInput,
	Textarea,
	Tooltip,
} from "@mantine/core"
import { useDisclosure, useLocalStorage } from "@mantine/hooks"
import {
	IconBrandInstagram,
	IconBrandReddit,
	IconBrandYoutube,
	IconCheck,
	IconEdit,
	IconExternalLink,
	IconFilter,
	IconLayoutGrid,
	IconLayoutList,
	IconRefresh,
	IconSearch,
	IconSparkles,
	IconWorld,
} from "@tabler/icons-react"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import { useState } from "react"
import { useSaves } from "./use-saves.hook"

dayjs.extend(relativeTime)

type Platform = Save["sourcePlatform"]
type ViewMode = "grid" | "compact"
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

const THUMB_RATIO = "5/2"

function matchesSearch(save: Save, query: string): boolean {
	if (!query) return true
	const q = query.toLowerCase()
	return (
		(save.title?.toLowerCase().includes(q) ?? false) ||
		(save.aiSummary?.toLowerCase().includes(q) ?? false) ||
		(save.description?.toLowerCase().includes(q) ?? false) ||
		(save.note?.toLowerCase().includes(q) ?? false) ||
		PLATFORM_META[save.sourcePlatform].label.toLowerCase().includes(q) ||
		save.sourcePlatform.toLowerCase().includes(q) ||
		save.tags.some((t) => t.toLowerCase().includes(q))
	)
}

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

function AddSaveCard({ onAdd, isAdding }: { onAdd: (url: string) => void; isAdding: boolean }) {
	const [url, setUrl] = useState("")

	function handleSave() {
		const trimmed = url.trim()
		if (!trimmed) return
		onAdd(trimmed)
		setUrl("")
	}

	return (
		<Card
			withBorder
			radius="md"
			padding="md"
			style={{
				borderStyle: "dashed",
				borderColor: "var(--mantine-color-gray-4)",
				display: "flex",
				flexDirection: "column",
				gap: 12,
			}}
		>
			<Text size="xs" fw={600} c="dimmed" tt="uppercase" style={{ letterSpacing: 1 }}>
				Save a link
			</Text>
			<Textarea
				placeholder="Paste a URL to save..."
				value={url}
				onChange={(e) => setUrl(e.currentTarget.value)}
				onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSave() } }}
				variant="filled"
				autosize
				minRows={4}
				styles={{ input: { resize: "none" } }}
			/>
			<Button fullWidth color="amber" loading={isAdding} onClick={handleSave}>
				Save
			</Button>
		</Card>
	)
}

function AddSaveCardCompact({ onAdd, isAdding }: { onAdd: (url: string) => void; isAdding: boolean }) {
	const [url, setUrl] = useState("")

	function handleSave() {
		const trimmed = url.trim()
		if (!trimmed) return
		onAdd(trimmed)
		setUrl("")
	}

	return (
		<Card
			withBorder
			radius="md"
			padding="sm"
			style={{
				borderStyle: "dashed",
				borderColor: "var(--mantine-color-gray-4)",
			}}
		>
			<Group wrap="nowrap" gap="sm" align="flex-end">
				<Stack gap={4} style={{ flex: 1 }}>
					<Text size="xs" fw={600} c="dimmed" tt="uppercase" style={{ letterSpacing: 1 }}>
						Save a link
					</Text>
					<Textarea
						placeholder="Paste a URL to save..."
						value={url}
						onChange={(e) => setUrl(e.currentTarget.value)}
						onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSave() } }}
						variant="filled"
						autosize
						minRows={2}
						styles={{ input: { resize: "none" } }}
					/>
				</Stack>
				<Button color="amber" loading={isAdding} onClick={handleSave} size="sm" style={{ flexShrink: 0 }}>
					Save
				</Button>
			</Group>
		</Card>
	)
}

function SaveCard({ save, onEdit }: { save: Save, onEdit: (save: Save) => void }) {
	const meta = PLATFORM_META[save.sourcePlatform]
	const PlatformIcon = meta.Icon

	return (
		<Card withBorder radius="md" padding={0} style={{ overflow: "hidden" }}>
			{save.thumbnailUrl ? (
				<Box
					style={{
						aspectRatio: THUMB_RATIO,
						backgroundImage: save.thumbnailUrl ? `url(${save.thumbnailUrl})` : `linear-gradient(135deg, ${meta.color}55, ${meta.color}99)`,
						backgroundSize: "cover",
						backgroundPosition: "center",
						position: "relative",
					}}
				>
					<Box
						style={{
							position: "absolute",
							inset: 0,
							background: "linear-gradient(to top, rgba(0,0,0,0.82) 35%, rgba(0,0,0,0.25) 100%)",
						}}
					/>

					{/* Title bottom */}
					<Box style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "0 8px 8px" }}>
						<PrivacyAwareText
							size="xs"
							fw={600}
							lineClamp={2}
							fz="h6"
							style={{ color: "#fff", lineHeight: 1.3 }}
						>
							{save.title ?? save.sourceUrl}
						</PrivacyAwareText>
					</Box>
					<Badge
						size="xs"
						color={meta.color}
						variant="filled"
						leftSection={<PlatformIcon size={10} />}
						style={{ position: "absolute", top: 8, left: 8 }}
					>
						{meta.label}
					</Badge>
				</Box>
			) : (
				<Box
					style={{
						aspectRatio: THUMB_RATIO,
						background: `var(--mantine-color-${meta.color}-1)`,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						position: "relative",
					}}
				>
					<PlatformIcon size={32} color={`var(--mantine-color-${meta.color}-5)`} />
					<Badge
						size="xs"
						color={meta.color}
						variant="filled"
						leftSection={<PlatformIcon size={10} />}
						style={{ position: "absolute", top: 8, left: 8 }}
					>
						{meta.label}
					</Badge>
				</Box>
			)}

			<Stack gap={6} p="sm">
				<Group justify="end" align="flex-start" wrap="nowrap">
					{/*<PrivacyAwareText fw={600} size="sm" lineClamp={2} style={{ flex: 1 }}>
						{save.title ?? save.sourceUrl}
					</PrivacyAwareText>*/}
					{(save.author || save.publishedAt) && (
						<Stack flex={1}>
							{save.author && <PrivacyAwareText size="xs" c="dimmed">
								{save.author}
							</PrivacyAwareText>}
							{
								save.author && save.publishedAt && <PrivacyAwareText size="xs" c="dimmed">
									{save.author && save.publishedAt && " · "}
								</PrivacyAwareText>
							}

							{save.publishedAt && <PrivacyAwareText size="xs" c="dimmed">
								{save.publishedAt && dayjs(save.publishedAt).fromNow()}
							</PrivacyAwareText>}
						</Stack>
					)}
					<Tooltip label="Open link">
						<ActionIcon
							component="a"
							href={save.sourceUrl}
							target="_blank"
							rel="noopener noreferrer"
							variant="subtle"
							color="gray"
							size="sm"
							style={{ flexShrink: 0 }}
						>
							<IconExternalLink size={14} />
						</ActionIcon>
					</Tooltip>

					<Tooltip label="Edit">
						<ActionIcon
							onClick={() => onEdit(save)}
							variant="subtle"
							color="gray"
							size="sm"
							style={{ flexShrink: 0 }}
						>
							<IconEdit size={14} />
						</ActionIcon>
					</Tooltip>
				</Group>



				{save.aiSummary ? (
					<Group gap={4} align="flex-start" wrap="nowrap">
						<IconSparkles size={11} style={{ color: "var(--mantine-color-violet-4)", marginTop: 2, flexShrink: 0 }} />
						<PrivacyAwareText size="xs" c="dimmed" lineClamp={2}>{save.aiSummary}</PrivacyAwareText>
					</Group>
				) : save.description ? (
					<PrivacyAwareText size="xs" c="dimmed" lineClamp={2}>{save.description}</PrivacyAwareText>
				) : null}

				{save.note && (
					<PrivacyAwareText size="xs" fs="italic" c="yellow.8">
						{save.note}
					</PrivacyAwareText>
				)}

				{save.tags.length > 0 && (
					<Group gap={4} wrap="wrap">
						{save.tags.slice(0, 6).map((tag) => (
							<Badge key={tag} size="xs" variant="light" color="gray" radius="sm">
								<PrivacyAwareText size="xs">{tag}</PrivacyAwareText>
							</Badge>
						))}
					</Group>
				)}

				{save.createdAt && <PrivacyAwareText size="xs" c="dimmed" mt={2}>
					Saved {dayjs(save.createdAt).fromNow()}
				</PrivacyAwareText>}
			</Stack>
		</Card >
	)
}

function SaveCardCompact({ save, onEdit }: { save: Save, onEdit: (save: Save) => void }) {
	const meta = PLATFORM_META[save.sourcePlatform]
	const PlatformIcon = meta.Icon

	return (
		<Card withBorder radius="md" padding={0} style={{ overflow: "hidden", position: "relative" }}>
			<Group wrap="nowrap" gap={0} style={{ minHeight: 80 }}>
				{save.thumbnailUrl ? (
					<Box
						style={{
							width: "35%",
							flexShrink: 0,
							alignSelf: "stretch",
							backgroundImage: save.thumbnailUrl ? `url(${save.thumbnailUrl})` : `linear-gradient(135deg, ${meta.color}55, ${meta.color}99)`,
							backgroundSize: "cover",
							backgroundPosition: "center",
							position: "relative",
							minHeight: 80,
						}}
					>

						<Box
							style={{
								position: "absolute",
								inset: 0,
								background: "linear-gradient(to top, rgba(0,0,0,0.62) 35%, rgba(0,0,0,0.25) 100%)",
							}}
						/>
						<Badge
							size="xs"
							color={meta.color}
							variant="filled"
							leftSection={<PlatformIcon size={10} />}
							style={{ position: "absolute", top: 6, left: 6 }}
						>
							{meta.label}
						</Badge>
					</Box>
				) : (
					<Box
						style={{
							width: "35%",
							flexShrink: 0,
							alignSelf: "stretch",
							background: `var(--mantine-color-${meta.color}-1)`,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							position: "relative",
							minHeight: 80,
						}}
					>

						<Box
							style={{
								position: "absolute",
								inset: 0,
								background: "linear-gradient(to top, rgba(0,0,0,0.62) 35%, rgba(0,0,0,0.25) 100%)",
							}}
						/>
						<PlatformIcon size={24} color={`var(--mantine-color-${meta.color}-5)`} />
						<Badge
							size="xs"
							color={meta.color}
							variant="filled"
							leftSection={<PlatformIcon size={10} />}
							style={{ position: "absolute", top: 6, left: 6 }}
						>
							{meta.label}
						</Badge>
					</Box>
				)}

				<Stack gap={4} p="sm" style={{ flex: 1, minWidth: 0 }}>
					<Group justify="space-between" align="flex-start" wrap="nowrap">
						<PrivacyAwareText fw={600} size="sm" lineClamp={1} style={{ flex: 1 }}>
							{save.title ?? save.sourceUrl}
						</PrivacyAwareText>
						<Tooltip label="Open link">
							<ActionIcon
								component="a"
								href={save.sourceUrl}
								target="_blank"
								rel="noopener noreferrer"
								variant="subtle"
								color="gray"
								size="sm"
								style={{ flexShrink: 0 }}
							>
								<IconExternalLink size={14} />
							</ActionIcon>
						</Tooltip>

						<Tooltip label="Edit">
							<ActionIcon
								onClick={() => onEdit(save)}
								variant="subtle"
								color="gray"
								size="sm"
								style={{ flexShrink: 0 }}
							>
								<IconEdit size={14} />
							</ActionIcon>
						</Tooltip>
					</Group>

					{save.aiSummary ? (
						<Group gap={4} align="flex-start" wrap="nowrap">
							<IconSparkles size={10} style={{ color: "var(--mantine-color-violet-4)", marginTop: 2, flexShrink: 0 }} />
							<PrivacyAwareText size="xs" c="dimmed" lineClamp={1}>{save.aiSummary}</PrivacyAwareText>
						</Group>
					) : save.description ? (
						<PrivacyAwareText size="xs" c="dimmed" lineClamp={1}>{save.description}</PrivacyAwareText>
					) : null}

					{save.note && (
						<PrivacyAwareText size="xs" fs="italic" c="yellow.7" lineClamp={1}>
							{save.note}
						</PrivacyAwareText>
					)}


					<Group>
						{save.author && <PrivacyAwareText size="xs" c="dimmed">
							{save.author && `${save.author} · `}
						</PrivacyAwareText>}

						{save.createdAt && <PrivacyAwareText size="xs" c="dimmed">
							{dayjs(save.createdAt).fromNow()}
						</PrivacyAwareText>}
					</Group>


					{save.tags.length > 0 && (
						<Group gap={4} wrap="nowrap">
							{save.tags.slice(0, 3).map((tag) => (
								<Badge key={tag} size="xs" variant="light" color="gray" radius="sm" style={{ flexShrink: 0 }}>
									<PrivacyAwareText fz="9px">{tag}</PrivacyAwareText>
								</Badge>
							))}
							{save.tags.length > 3 && (
								<Badge size="xs" variant="outline" color="gray" radius="sm" style={{ flexShrink: 0 }}>
									+{save.tags.length - 3}
								</Badge>
							)}
						</Group>
					)}
				</Stack>
			</Group>
		</Card>
	)
}

function SaveCardSkeleton() {
	return (
		<Card withBorder radius="md" padding={0} style={{ overflow: "hidden" }}>
			<Skeleton height={0} style={{ aspectRatio: "16/9" }} radius={0} />
			<Stack gap={6} p="sm">
				<Skeleton height={14} width="80%" />
				<Skeleton height={10} width="40%" />
				<Skeleton height={10} />
				<Skeleton height={10} width="60%" />
			</Stack>
		</Card>
	)
}

function SaveCardSkeletonCompact() {
	return (
		<Card withBorder radius="md" padding={0} style={{ overflow: "hidden" }}>
			<Group wrap="nowrap" gap={0} style={{ height: 80 }}>
				<Skeleton width="35%" height={80} radius={0} />
				<Stack gap={6} p="sm" style={{ flex: 1 }}>
					<Skeleton height={14} width="70%" />
					<Skeleton height={10} width="50%" />
					<Skeleton height={10} width="30%" />
				</Stack>
			</Group>
		</Card>
	)
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
	const { addSave, isAdding } = useSaves()
	const [platform, setPlatform] = useState<Platform | "all">("all")
	const [search, setSearch] = useState("")
	const [activeTags, setActiveTags] = useState<string[]>([])
	const [activeLists, setActiveLists] = useState<string[]>([])
	const [sortOrder, setSortOrder] = useState<SortOrder>("newest")
	const [viewMode, setViewMode] = useLocalStorage<ViewMode>({
		key: "saves-view-mode",
		defaultValue: "grid",
	})

	const allTags = collectAllTags(saves)
	const allLists = collectAllLists(saves)

	const filtered = saves
		.filter((s) => {
			const platformMatch = platform === "all" || s.sourcePlatform === platform
			const tagMatch = activeTags.length === 0 || activeTags.some((t) => s.tags.includes(t))
			const listMatch = activeLists.length === 0 || activeLists.some((l) => s.lists?.includes(l))
			return platformMatch && tagMatch && listMatch && matchesSearch(s, search)
		})
		.sort((a, b) => {
			const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
			return sortOrder === "newest" ? -diff : diff
		})

	const isCompact = viewMode === "compact"
	const [opened, { open, close }] = useDisclosure(false);
	const [selectedSave, setSelectedSave] = useState<Save | null>(null)

	const activeFilterCount =
		(platform !== "all" ? 1 : 0) +
		activeTags.length +
		activeLists.length +
		(sortOrder !== "newest" ? 1 : 0)

	return (
		<Stack gap="md">
			{selectedSave && <UpdateSaveModal save={selectedSave} opened={opened} onClose={close} />}
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

						<Menu.Divider />
						<Menu.Label>View</Menu.Label>
						<Menu.Item
							onClick={() => setViewMode("grid")}
							leftSection={<IconLayoutGrid size={14} />}
							rightSection={!isCompact ? <IconCheck size={13} /> : null}
						>
							Grid
						</Menu.Item>
						<Menu.Item
							onClick={() => setViewMode("compact")}
							leftSection={<IconLayoutList size={14} />}
							rightSection={isCompact ? <IconCheck size={13} /> : null}
						>
							Compact
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

			{isCompact ? (
				<Stack gap="sm">
					<AddSaveCardCompact onAdd={addSave} isAdding={isAdding} />
					{isLoading
						? [1, 2, 3, 4, 5].map((i) => <SaveCardSkeletonCompact key={i} />)
						: filtered.map((save) => <SaveCardCompact key={save.id} save={save} onEdit={(s) => { setSelectedSave(s); open() }} />)}
				</Stack>
			) : (
				<SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
					<AddSaveCard onAdd={addSave} isAdding={isAdding} />
					{isLoading
						? [1, 2, 3, 4, 5].map((i) => <SaveCardSkeleton key={i} />)
						: filtered.map((save) => <SaveCard key={save.id} save={save} onEdit={(s) => { setSelectedSave(s); open() }} />)}
				</SimpleGrid>
			)}

			{!isLoading && filtered.length === 0 && (
				<Text c="dimmed" ta="center" size="sm" mt="xl">
					{search || platform !== "all" || activeTags.length > 0 ? "No saves match your filters" : "No saves yet"}
				</Text>
			)}
		</Stack>
	)
}
