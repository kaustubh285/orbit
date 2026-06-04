import { PrivacyAwareText } from "@/components/privacy-aware-text.component"
import { UpdateSaveModal } from "@/components/saves/update-save-modal.component"
import type { Save } from "@/types"
import {
	ActionIcon,
	Badge,
	Box,
	Button,
	Card,
	Chip,
	Group,
	ScrollArea,
	Select,
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
	IconEdit,
	IconExternalLink,
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
							<Text size="xs" c="dimmed" lineClamp={1}>{save.aiSummary}</Text>
						</Group>
					) : save.description ? (
						<Text size="xs" c="dimmed" lineClamp={1}>{save.description}</Text>
					) : null}

					{save.note && (
						<Text size="xs" fs="italic" c="yellow.7" lineClamp={1}>
							{save.note}
						</Text>
					)}

					{save.tags.length > 0 && (
						<Group gap={4}>
							{save.tags.slice(0, 4).map((tag) => (
								<Badge key={tag} size="xs" variant="light" color="gray" radius="sm">
									{tag}
								</Badge>
							))}
						</Group>
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
	const [activeTag, setActiveTag] = useState<string | null>(null)
	const [viewMode, setViewMode] = useLocalStorage<ViewMode>({
		key: "saves-view-mode",
		defaultValue: "grid",
	})

	const allTags = collectAllTags(saves)

	const filtered = saves.filter((s) => {
		const platformMatch = platform === "all" || s.sourcePlatform === platform
		const tagMatch = !activeTag || s.tags.includes(activeTag)
		return platformMatch && tagMatch && matchesSearch(s, search)
	})

	const isCompact = viewMode === "compact"
	const [opened, { open, close }] = useDisclosure(false);
	const [selectedSave, setSelectedSave] = useState<Save | null>(null)

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

			{allTags.length > 0 && (
				<ScrollArea scrollbarSize={4}>
					<Chip.Group value={activeTag ?? ""} onChange={(v) => setActiveTag(v || null)}>
						<Group gap={6} wrap="nowrap" pb={4}>
							{allTags.map((tag) => (
								<Chip key={tag} size="xs" value={tag} variant="light" radius="sm">
									{tag}
								</Chip>
							))}
						</Group>
					</Chip.Group>
				</ScrollArea>
			)}

			{isCompact ? (
				<Stack gap="sm">
					<AddSaveCardCompact onAdd={onAdd} isAdding={isAdding} />
					{isLoading
						? [1, 2, 3, 4, 5].map((i) => <SaveCardSkeletonCompact key={i} />)
						: filtered.map((save) => <SaveCardCompact key={save.id} save={save} onEdit={(s) => { setSelectedSave(s); open() }} />)}
				</Stack>
			) : (
				<SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
					<AddSaveCard onAdd={onAdd} isAdding={isAdding} />
					{isLoading
						? [1, 2, 3, 4, 5].map((i) => <SaveCardSkeleton key={i} />)
						: filtered.map((save) => <SaveCard key={save.id} save={save} onEdit={(s) => { setSelectedSave(s); open() }} />)}
				</SimpleGrid>
			)}

			{!isLoading && filtered.length === 0 && (
				<Text c="dimmed" ta="center" size="sm" mt="xl">
					{search || platform !== "all" || activeTag ? "No saves match your filters" : "No saves yet"}
				</Text>
			)}
		</Stack>
	)
}
