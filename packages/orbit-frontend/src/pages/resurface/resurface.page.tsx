import { ActionIcon, Badge, Box, Group, Pill, Stack, Text, Tooltip, CloseButton } from "@mantine/core";
import { DepthSelect } from "@gfazioli/mantine-depth-select";
import type { DepthSelectItem } from "@gfazioli/mantine-depth-select";
import {
	IconBrandYoutube, IconBrandReddit, IconBrandInstagram, IconWorld,
	IconSparkles, IconMapPin, IconLayersIntersect, IconRefresh,
} from "@tabler/icons-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useEffect } from "react";
import { useResurface } from "./use-resurface.hook";
import type { PostSavesResurfaceResponses } from "@orbit/client";

dayjs.extend(relativeTime);

type ResurfacedSave = PostSavesResurfaceResponses[200];

type StructuredSummary = {
	summary: string;
	category?: string;
	contentType?: string;
	attributes?: { difficulty: string | null; timeEstimate: string | null } | null;
	keyPoints?: string[] | null;
	watchList?: string[] | null;
	location?: { name: string; context: string } | null;
	timeSensitive?: boolean;
};

function parseStructuredSummary(raw: string | null): StructuredSummary | null {
	if (!raw) return null;
	try {
		const parsed = JSON.parse(raw);
		if (parsed && typeof parsed === "object" && typeof parsed.summary === "string") return parsed;
		return null;
	} catch {
		return null;
	}
}

const PLATFORM_META: Record<ResurfacedSave["sourcePlatform"], { label: string; color: string; hex: string; Icon: React.ElementType }> = {
	youtube:   { label: "YouTube",   color: "red",    hex: "#e03131", Icon: IconBrandYoutube },
	reddit:    { label: "Reddit",    color: "orange",  hex: "#e8590c", Icon: IconBrandReddit },
	instagram: { label: "Instagram", color: "grape",   hex: "#9c36b5", Icon: IconBrandInstagram },
	web:       { label: "Web",       color: "cyan",    hex: "#0c8599", Icon: IconWorld },
};

function ResurfaceCardSkeleton() {
	return (
		<Box
			style={{
				height: 280,
				borderRadius: 12,
				background: "var(--mantine-color-dark-6)",
				border: "1px solid var(--mantine-color-dark-4)",
				animation: "pulse 1.5s ease-in-out infinite",
			}}
		/>
	);
}

function ResurfaceCard({ save, onUncache }: { save: ResurfacedSave; onUncache: () => void }) {
	const ai = parseStructuredSummary(save?.aiSummary);
	const meta = PLATFORM_META[save?.sourcePlatform];
	if (!save || !meta) return null;

	const PlatformIcon = meta.Icon;
	const title = save.aiTitle ?? save.title ?? save.sourceUrl;

	return (
		<Box
			style={{
				height: 280,
				borderRadius: 12,
				border: "1px solid var(--mantine-color-dark-4)",
				background: "var(--mantine-color-dark-7)",
				overflow: "hidden",
				display: "flex",
				flexDirection: "row",
			}}
		>
			{/* Thumbnail */}
			{save.thumbnailUrl ? (
				<Box w={200} style={{ flexShrink: 0, position: "relative" }}>
					<img
						src={save.thumbnailUrl}
						alt=""
						referrerPolicy="no-referrer"
						style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
					/>
					<Box style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, transparent 60%, var(--mantine-color-dark-7))" }} />
				</Box>
			) : (
				<Box
					w={200}
					style={{
						flexShrink: 0,
						background: `linear-gradient(135deg, ${meta.hex}33, ${meta.hex}66)`,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					<PlatformIcon size={48} color={`${meta.hex}99`} />
				</Box>
			)}

			{/* Content */}
			<Stack p="lg" gap="xs" style={{ flex: 1, overflow: "hidden", minWidth: 0 }}>
				{/* Badges */}
				<Group gap={6} justify="space-between">
					<Group gap={6}>
						<Badge size="xs" color={meta.color} variant="light" leftSection={<PlatformIcon size={10} />}>
							{meta.label}
						</Badge>
						{ai?.category && <Badge size="xs" variant="light" color="violet">{ai.category}</Badge>}
						{ai?.contentType && <Badge size="xs" variant="light" color="blue">{ai.contentType}</Badge>}
						{ai?.timeSensitive && <Badge size="xs" color="orange" variant="light">Time sensitive</Badge>}
					</Group>
					<Tooltip label="Remove from resurface queue">
						<CloseButton size="sm" variant="subtle" color="gray" onClick={onUncache} />
					</Tooltip>
				</Group>

				{/* Title */}
				<Text fw={700} size="md" lineClamp={2} style={{ lineHeight: 1.3 }}>
					{title}
				</Text>

				{/* Author + date */}
				{(save.author || save.publishedAt) && (
					<Group gap={4}>
						{save.author && <Text size="xs" c="dimmed">{save.author}</Text>}
						{save.author && save.publishedAt && <Text size="xs" c="dimmed">·</Text>}
						{save.publishedAt && <Text size="xs" c="dimmed">{dayjs(save.publishedAt).fromNow()}</Text>}
					</Group>
				)}

				{/* AI summary */}
				{ai?.summary && (
					<Group gap={6} align="flex-start" wrap="nowrap">
						<IconSparkles size={12} style={{ color: "var(--mantine-color-violet-4)", flexShrink: 0, marginTop: 2 }} />
						<Text size="xs" c="dimmed" fs="italic" lineClamp={3}>{ai.summary}</Text>
					</Group>
				)}

				{/* Key points */}
				{ai?.keyPoints && ai.keyPoints.length > 0 && (
					<Stack gap={2}>
						{ai.keyPoints.slice(0, 2).map((point, i) => (
							<Group key={i} gap={6} wrap="nowrap">
								<Text size="xs" c="dimmed" style={{ flexShrink: 0 }}>·</Text>
								<Text size="xs" c="dimmed" lineClamp={1}>{point}</Text>
							</Group>
						))}
					</Stack>
				)}

				{/* Location */}
				{ai?.location && (
					<Group gap={4}>
						<IconMapPin size={11} style={{ color: "var(--mantine-color-dimmed)", flexShrink: 0 }} />
						<Text size="xs" c="dimmed" lineClamp={1}>
							{ai.location.name}{ai.location.context ? ` — ${ai.location.context}` : ""}
						</Text>
					</Group>
				)}

				{/* Tags */}
				{save.tags.length > 0 && (
					<Group gap={4} mt="auto">
						{save.tags.slice(0, 5).map((tag) => (
							<Pill key={tag} size="xs">{tag}</Pill>
						))}
					</Group>
				)}
			</Stack>
		</Box>
	);
}

function EmptyState() {
	return (
		<Stack align="center" gap="sm" py={80}>
			<IconLayersIntersect size={40} color="var(--mantine-color-dark-3)" stroke={1.2} />
			<Stack align="center" gap={4}>
				<Text fw={600} size="sm">Nothing to resurface</Text>
				<Text size="xs" c="dimmed" ta="center" maw={280}>
					Enable "Include in Resurface" on a list to start seeing saves bubble back up here.
				</Text>
			</Stack>
		</Stack>
	);
}

export function ResurfacePage() {
	const { saves, fetchIfStale, resurface, uncache, isPending, isError } = useResurface();

	useEffect(() => {
		fetchIfStale();
	}, []);

	const items: DepthSelectItem[] = saves.map((save, idx) => ({
		value: idx,
		view: <ResurfaceCard save={save} onUncache={() => uncache(save.id)} />,
	}));

	return (
		<Stack gap="xl" pt="sm">
			<Group justify="space-between" align="flex-end">
				<Stack gap={2}>
					<Text fw={700} size="xl">Resurface</Text>
					<Text size="sm" c="dimmed">Things you saved, worth revisiting</Text>
				</Stack>
				<Group gap="sm">
					{saves.length > 0 && (
						<Text size="xs" c="dimmed">{saves.length} resurface{saves.length !== 1 ? "s" : ""}</Text>
					)}
					<Tooltip label="Resurface another">
						<ActionIcon variant="subtle" color="gray" loading={isPending} onClick={resurface}>
							<IconRefresh size={16} />
						</ActionIcon>
					</Tooltip>
				</Group>
			</Group>

			{isError && (
				<Text size="sm" c="red">Something went wrong loading resurfaces.</Text>
			)}

			{isPending && items.length === 0 && <ResurfaceCardSkeleton />}

			{!isPending && items.length === 0 && !isError && <EmptyState />}

			{items.length > 0 && (
				<Stack pt={60} pb={60}>
					<DepthSelect
						visibleCards={5}
						translateYStep={40}
						blurStep={1.5}
						data={items}
						loop
						controlsProps={{ labelFormatter: (item) => String(Number(item.value) + 1) }}
						w="50vw"
						h={280}
					/>
				</Stack>
			)}
		</Stack>
	);
}
