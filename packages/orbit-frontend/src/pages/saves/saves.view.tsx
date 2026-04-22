import type { Save } from "@/types"
import {
	ActionIcon,
	Badge,
	Box,
	Button,
	Card,
	Group,
	SimpleGrid,
	Skeleton,
	Stack,
	Text,
	Textarea,
	Tooltip,
} from "@mantine/core"
import {
	IconBrandInstagram,
	IconBrandReddit,
	IconBrandYoutube,
	IconExternalLink,
	IconRefresh,
	IconWorld,
} from "@tabler/icons-react"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import { useState } from "react"

dayjs.extend(relativeTime)

type Platform = Save["sourcePlatform"]

const PLATFORM_META: Record<Platform, { label: string; color: string; Icon: React.ElementType }> = {
	youtube: { label: "YouTube", color: "red", Icon: IconBrandYoutube },
	reddit: { label: "Reddit", color: "orange", Icon: IconBrandReddit },
	instagram: { label: "Instagram", color: "grape", Icon: IconBrandInstagram },
	web: { label: "Web", color: "blue", Icon: IconWorld },
}

const FILTERS: { label: string; value: Platform | "all" }[] = [
	{ label: "All", value: "all" },
	{ label: "YouTube", value: "youtube" },
	{ label: "Reddit", value: "reddit" },
	{ label: "Instagram", value: "instagram" },
	{ label: "Web", value: "web" },
]

const THUMB_RATIO = "5/2"

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
			<Button
				bg="indigo"
				fullWidth
				radius={0}
				loading={isAdding}
				onClick={handleSave}
			>
				Save
			</Button>
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

	const filtered = platform === "all"
		? saves
		: saves.filter((s) => s.sourcePlatform === platform)

	return (
		<Stack>
			<AddSaveCard onAdd={onAdd} isAdding={isAdding} />
			<Group justify="space-between">
				<Group gap="xs">
					{FILTERS.map((f) => {
						const active = platform === f.value
						return (
							<Badge
								key={f.value}
								variant={active ? "filled" : "light"}
								color={active ? "dark" : "gray"}
								onClick={() => setPlatform(f.value)}
								style={{ cursor: "pointer" }}
								size="sm"
							>
								{f.label}
							</Badge>
						)
					})}
				</Group>
				<Tooltip label="Refresh">
					<ActionIcon variant="subtle" color="gray" onClick={onRefetch} loading={isLoading}>
						<IconRefresh size={16} />
					</ActionIcon>
				</Tooltip>
			</Group>

			{isLoading ? (
				<SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
					{[1, 2, 3, 4, 5, 6].map((i) => <SaveCardSkeleton key={i} />)}
				</SimpleGrid>
			) : filtered.length === 0 ? (
				<Text c="dimmed" ta="center" size="sm" mt="xl">
					No saves yet
				</Text>
			) : (
				<SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
					{filtered.map((save) => <SaveCard key={save.id} save={save} />)}
				</SimpleGrid>
			)}
		</Stack>
	)
}
