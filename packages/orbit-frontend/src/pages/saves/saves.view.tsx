import type { Save } from "@/types"
import {
	ActionIcon,
	Badge,
	Box,
	Button,
	Card,
	Group,
	Select,
	SimpleGrid,
	Skeleton,
	Stack,
	Text,
	TextInput,
	Textarea,
	Tooltip,
} from "@mantine/core"
import { useLocalStorage } from "@mantine/hooks"
import {
	IconBrandInstagram,
	IconBrandReddit,
	IconBrandYoutube,
	IconExternalLink,
	IconLayoutGrid,
	IconLayoutList,
	IconRefresh,
	IconSearch,
	IconWorld,
} from "@tabler/icons-react"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import { useState } from "react"

dayjs.extend(relativeTime)

type Platform = Save["sourcePlatform"]
type ViewMode = "grid" | "compact"

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
		(save.description?.toLowerCase().includes(q) ?? false) ||
		(save.note?.toLowerCase().includes(q) ?? false) ||
		PLATFORM_META[save.sourcePlatform].label.toLowerCase().includes(q) ||
		save.sourcePlatform.toLowerCase().includes(q)
	)
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
		<Card withBorder radius="md" padding={0} style={{ overflow: "hidden" }}>
			<Box
				style={{
					aspectRatio: THUMB_RATIO,
					display: "flex",
					alignItems: "stretch",
					background: "var(--mantine-color-gray-0)",
					padding: 12,
				}}
			>
				<Textarea
					placeholder="Paste a URL to save..."
					value={url}
					onChange={(e) => setUrl(e.currentTarget.value)}
					onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSave() } }}
					variant="unstyled"
					style={{ flex: 1 }}
					styles={{ input: { height: "100%", resize: "none" } }}
				/>
			</Box>
			<Box flex={1} h="auto" p="xs">
				<Button fullWidth radius={0} color="amber" loading={isAdding} onClick={handleSave}>
					Save
				</Button>
			</Box>
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
		<Card withBorder radius="md" padding={0} style={{ overflow: "hidden" }}>
			<Group wrap="nowrap" gap={0} style={{ height: 80 }}>
				<Box
					style={{
						width: "35%",
						flexShrink: 0,
						height: "100%",
						background: "var(--mantine-color-gray-0)",
						padding: 10,
						display: "flex",
						alignItems: "stretch",
					}}
				>
					<Textarea
						placeholder="Paste a URL..."
						value={url}
						onChange={(e) => setUrl(e.currentTarget.value)}
						onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSave() } }}
						variant="unstyled"
						size="xs"
						style={{ flex: 1 }}
						styles={{ input: { height: "100%", resize: "none", fontSize: 11 } }}
					/>
				</Box>
				<Box style={{ flex: 1, display: "flex", alignItems: "center", padding: "0 12px" }}>
					<Button size="xs" color="amber" loading={isAdding} onClick={handleSave}>
						Save
					</Button>
				</Box>
			</Group>
		</Card>
	)
}

function SaveCard({ save }: { save: Save }) {
	const meta = PLATFORM_META[save.sourcePlatform]
	const PlatformIcon = meta.Icon

	return (
		<Card withBorder radius="md" padding={0} style={{ overflow: "hidden" }}>
			{save.thumbnailUrl ? (
				<Box
					style={{
						aspectRatio: THUMB_RATIO,
						backgroundImage: `url(${save.thumbnailUrl})`,
						backgroundSize: "cover",
						backgroundPosition: "center",
						position: "relative",
					}}
				>
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
				<Group justify="space-between" align="flex-start" wrap="nowrap">
					<Text fw={600} size="sm" lineClamp={2} style={{ flex: 1 }}>
						{save.title ?? save.sourceUrl}
					</Text>
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
				</Group>

				{(save.author || save.publishedAt) && (
					<Text size="xs" c="dimmed">
						{save.author}
						{save.author && save.publishedAt && " · "}
						{save.publishedAt && dayjs(save.publishedAt).fromNow()}
					</Text>
				)}

				{save.description && (
					<Text size="xs" c="dimmed" lineClamp={2}>
						{save.description}
					</Text>
				)}

				{save.note && (
					<Box
						p="xs"
						style={{
							background: "var(--mantine-color-yellow-0)",
							borderLeft: "2px solid var(--mantine-color-yellow-4)",
							borderRadius: 4,
						}}
					>
						<Text size="xs" fs="italic" c="yellow.8">
							{save.note}
						</Text>
					</Box>
				)}

				<Text size="xs" c="dimmed" mt={2}>
					Saved {dayjs(save.createdAt).fromNow()}
				</Text>
			</Stack>
		</Card>
	)
}

function SaveCardCompact({ save }: { save: Save }) {
	const meta = PLATFORM_META[save.sourcePlatform]
	const PlatformIcon = meta.Icon

	return (
		<Card withBorder radius="md" padding={0} style={{ overflow: "hidden" }}>
			<Group wrap="nowrap" gap={0} style={{ minHeight: 80 }}>
				{save.thumbnailUrl ? (
					<Box
						style={{
							width: "35%",
							flexShrink: 0,
							alignSelf: "stretch",
							backgroundImage: `url(${save.thumbnailUrl})`,
							backgroundSize: "cover",
							backgroundPosition: "center",
							position: "relative",
							minHeight: 80,
						}}
					>
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
						<Text fw={600} size="sm" lineClamp={1} style={{ flex: 1 }}>
							{save.title ?? save.sourceUrl}
						</Text>
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
					</Group>

					{save.description && (
						<Text size="xs" c="dimmed" lineClamp={1}>
							{save.description}
						</Text>
					)}

					{save.note && (
						<Text size="xs" fs="italic" c="yellow.7" lineClamp={1}>
							{save.note}
						</Text>
					)}

					<Text size="xs" c="dimmed">
						{save.author && `${save.author} · `}
						{dayjs(save.createdAt).fromNow()}
					</Text>
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
	onAdd,
	isAdding,
	onRefetch,
}: {
	saves: Save[]
	isLoading: boolean
	onAdd: (url: string) => void
	isAdding: boolean
	onRefetch: () => void
}) {
	const [platform, setPlatform] = useState<Platform | "all">("all")
	const [search, setSearch] = useState("")
	const [viewMode, setViewMode] = useLocalStorage<ViewMode>({
		key: "saves-view-mode",
		defaultValue: "grid",
	})

	const filtered = saves.filter((s) => {
		const platformMatch = platform === "all" || s.sourcePlatform === platform
		return platformMatch && matchesSearch(s, search)
	})

	const isCompact = viewMode === "compact"

	return (
		<Stack gap="md">
			<Group wrap="nowrap" gap="sm">
				<TextInput
					placeholder="Search title, description, notes, platform..."
					leftSection={<IconSearch size={14} />}
					value={search}
					onChange={(e) => setSearch(e.currentTarget.value)}
					style={{ flex: 1 }}
					size="sm"
				/>
				<Select
					data={PLATFORM_OPTIONS}
					value={platform}
					onChange={(v) => setPlatform((v ?? "all") as Platform | "all")}
					size="sm"
					w={160}
					allowDeselect={false}
					checkIconPosition="right"
				/>
				<Group gap={4}>
					<Tooltip label="Grid view">
						<ActionIcon
							variant={!isCompact ? "filled" : "subtle"}
							color={!isCompact ? "amber" : "gray"}
							onClick={() => setViewMode("grid")}
							size="sm"
						>
							<IconLayoutGrid size={15} />
						</ActionIcon>
					</Tooltip>
					<Tooltip label="Compact view">
						<ActionIcon
							variant={isCompact ? "filled" : "subtle"}
							color={isCompact ? "amber" : "gray"}
							onClick={() => setViewMode("compact")}
							size="sm"
						>
							<IconLayoutList size={15} />
						</ActionIcon>
					</Tooltip>
					<Tooltip label="Refresh">
						<ActionIcon variant="subtle" color="gray" onClick={onRefetch} loading={isLoading} size="sm">
							<IconRefresh size={15} />
						</ActionIcon>
					</Tooltip>
				</Group>
			</Group>

			{isCompact ? (
				<Stack gap="sm">
					<AddSaveCardCompact onAdd={onAdd} isAdding={isAdding} />
					{isLoading
						? [1, 2, 3, 4, 5].map((i) => <SaveCardSkeletonCompact key={i} />)
						: filtered.map((save) => <SaveCardCompact key={save.id} save={save} />)}
				</Stack>
			) : (
				<SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
					<AddSaveCard onAdd={onAdd} isAdding={isAdding} />
					{isLoading
						? [1, 2, 3, 4, 5].map((i) => <SaveCardSkeleton key={i} />)
						: filtered.map((save) => <SaveCard key={save.id} save={save} />)}
				</SimpleGrid>
			)}

			{!isLoading && filtered.length === 0 && (
				<Text c="dimmed" ta="center" size="sm" mt="xl">
					{search || platform !== "all" ? "No saves match your filters" : "No saves yet"}
				</Text>
			)}
		</Stack>
	)
}
