import {
	Badge,
	Box,
	Group,
	Progress,
	RingProgress,
	Select,
	SimpleGrid,
	Skeleton,
	Stack,
	Text,
	ThemeIcon,
} from "@mantine/core"
import {
	IconBrandInstagram,
	IconBrandReddit,
	IconBrandYoutube,
	IconCalendar,
	IconCheck,
	IconClock,
	IconFileText,
	IconFlame,
	IconList,
	IconSparkles,
	IconTag,
	IconWorld,
} from "@tabler/icons-react"
import dayjs from "dayjs"
import { useState } from "react"
import { useReport, type ReportData } from "./use-report.hook"

// ---------------------------------------------------------------------------
// Preset ranges
// ---------------------------------------------------------------------------
export type RangeKey = "7d" | "30d" | "thisWeek" | "thisMonth" | "lastMonth"

export function getRangeDates(key: RangeKey): { start: string; end: string } {
	const now = dayjs()
	switch (key) {
		case "7d":
			return { start: now.subtract(6, "day").startOf("day").toISOString(), end: now.endOf("day").toISOString() }
		case "30d":
			return { start: now.subtract(29, "day").startOf("day").toISOString(), end: now.endOf("day").toISOString() }
		case "thisWeek":
			return { start: now.startOf("week").toISOString(), end: now.endOf("week").toISOString() }
		case "thisMonth":
			return { start: now.startOf("month").toISOString(), end: now.endOf("month").toISOString() }
		case "lastMonth": {
			const lm = now.subtract(1, "month")
			return { start: lm.startOf("month").toISOString(), end: lm.endOf("month").toISOString() }
		}
	}
}

export const RANGE_OPTIONS: { value: RangeKey; label: string }[] = [
	{ value: "7d", label: "Last 7 days" },
	{ value: "30d", label: "Last 30 days" },
	{ value: "thisWeek", label: "This week" },
	{ value: "thisMonth", label: "This month" },
	{ value: "lastMonth", label: "Last month" },
]

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------
function StatCard({
	label,
	value,
	color = "dimmed",
	icon,
}: {
	label: string
	value: number | string
	color?: string
	icon?: React.ReactNode
}) {
	return (
		<Box
			style={{
				borderRadius: 10,
				border: "1px solid var(--mantine-color-dark-4)",
				padding: "14px 16px",
				background: "var(--mantine-color-dark-7)",
			}}
		>
			<Stack gap={6}>
				<Group gap={6}>
					{icon && <Box style={{ color: `var(--mantine-color-${color}-5)`, lineHeight: 0 }}>{icon}</Box>}
					<Text size="xs" c="dimmed">{label}</Text>
				</Group>
				<Text fw={700} size="xl" c={color !== "dimmed" ? color : undefined}>{value}</Text>
			</Stack>
		</Box>
	)
}

function StatCardSkeleton() {
	return (
		<Box
			style={{
				borderRadius: 10,
				border: "1px solid var(--mantine-color-dark-4)",
				padding: "14px 16px",
				background: "var(--mantine-color-dark-7)",
			}}
		>
			<Stack gap={6}>
				<Skeleton height={12} width="60%" />
				<Skeleton height={24} width="40%" />
			</Stack>
		</Box>
	)
}

// ---------------------------------------------------------------------------
// Section header
// ---------------------------------------------------------------------------
function SectionHeader({ label }: { label: string }) {
	return (
		<Text size="xs" c="dimmed" tt="uppercase" fw={600} style={{ letterSpacing: "0.08em" }}>
			{label}
		</Text>
	)
}

// ---------------------------------------------------------------------------
// Platform bar
// ---------------------------------------------------------------------------
const PLATFORM_META = {
	youtube: { label: "YouTube", color: "red", Icon: IconBrandYoutube },
	reddit: { label: "Reddit", color: "orange", Icon: IconBrandReddit },
	instagram: { label: "Instagram", color: "grape", Icon: IconBrandInstagram },
	web: { label: "Web", color: "cyan", Icon: IconWorld },
} as const

function PlatformBreakdown({ savesByPlatform }: { savesByPlatform: ReportData["savesByPlatform"] }) {
	const total = Object.values(savesByPlatform).reduce((a, b) => a + b, 0)
	const entries = (Object.entries(savesByPlatform) as [keyof typeof PLATFORM_META, number][])
		.sort((a, b) => b[1] - a[1])

	if (total === 0) return <Text size="sm" c="dimmed">No saves in this period</Text>

	return (
		<Stack gap={8}>
			{entries.map(([platform, count]) => {
				const { label, color, Icon } = PLATFORM_META[platform]
				const pct = total > 0 ? Math.round((count / total) * 100) : 0
				return (
					<Stack gap={4} key={platform}>
						<Group justify="space-between">
							<Group gap={6}>
								<Icon size={13} />
								<Text size="xs">{label}</Text>
							</Group>
							<Text size="xs" c="dimmed">{count} ({pct}%)</Text>
						</Group>
						<Progress value={pct} color={color} size="xs" radius="xl" />
					</Stack>
				)
			})}
		</Stack>
	)
}

// ---------------------------------------------------------------------------
// Report content
// ---------------------------------------------------------------------------
export function ReportContent({ data, range }: { data: ReportData; range: RangeKey }) {
	const totalQuestActivity = data.questsCompleted + data.questsIncomplete

	return (
		<Stack gap="xl">
			{/* Quests */}
			<Stack gap="xs">
				<SectionHeader label="Quests" />
				<SimpleGrid cols={{ base: 2, sm: 4 }} spacing="sm">
					<StatCard label="Completed" value={data.questsCompleted} color="teal" icon={<IconCheck size={13} />} />
					<StatCard label="Incomplete" value={data.questsIncomplete} icon={<IconClock size={13} />} />
					<StatCard label="Overdue" value={data.overdueQuests} color={data.overdueQuests > 0 ? "red" : "dimmed"} />
					<Box
						style={{
							borderRadius: 10,
							border: "1px solid var(--mantine-color-dark-4)",
							padding: "14px 16px",
							background: "var(--mantine-color-dark-7)",
						}}
					>
						<Group gap="md" align="center">
							<RingProgress
								size={56}
								thickness={5}
								roundCaps
								sections={[
									{ value: data.questCompletionRate, color: "teal" },
								]}
								label={
									<Text ta="center" size="xs" fw={700}>{data.questCompletionRate}%</Text>
								}
							/>
							<Stack gap={2}>
								<Text size="xs" c="dimmed">Completion rate</Text>
								<Text size="xs" c="dimmed">{totalQuestActivity} total</Text>
							</Stack>
						</Group>
					</Box>
				</SimpleGrid>
			</Stack>

			{/* Saves */}
			<Stack gap="xs">
				<SectionHeader label="Saves" />
				<SimpleGrid cols={{ base: 2, sm: 3 }} spacing="sm">
					<StatCard label="Added" value={data.savesAdded} color="amber" icon={<IconCalendar size={13} />} />
					<StatCard label="Archived" value={data.savesArchived} />
					<StatCard label="AI summaries" value={data.aiSummariesGenerated} color="violet" icon={<IconSparkles size={13} />} />
				</SimpleGrid>
				<Box
					style={{
						borderRadius: 10,
						border: "1px solid var(--mantine-color-dark-4)",
						padding: "14px 16px",
						background: "var(--mantine-color-dark-7)",
					}}
				>
					<Stack gap={8}>
						<Text size="xs" c="dimmed">By platform</Text>
						<PlatformBreakdown savesByPlatform={data.savesByPlatform} />
					</Stack>
				</Box>
			</Stack>

			{/* Notes + Consistency */}
			<SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
				<Stack gap="xs">
					<SectionHeader label="Notes" />
					<SimpleGrid cols={2} spacing="sm">
						<StatCard label="Created" value={data.notesCreated} icon={<IconFileText size={13} />} />
						<StatCard label="Edited" value={data.notesEdited} />
					</SimpleGrid>
				</Stack>

				<Stack gap="xs">
					<SectionHeader label="Consistency" />
					<Box
						style={{
							borderRadius: 10,
							border: "1px solid var(--mantine-color-dark-4)",
							padding: "14px 16px",
							background: "var(--mantine-color-dark-7)",
							height: "100%",
						}}
					>
						<Group gap="md" align="center">
							<ThemeIcon size={48} radius="md" color="pink" variant="light">
								<IconFlame size={24} />
							</ThemeIcon>
							<Stack gap={2}>
								<Text fw={700} size="xl">{data.activeDays}</Text>
								<Text size="xs" c="dimmed">active day{data.activeDays !== 1 ? "s" : ""}</Text>
							</Stack>
						</Group>
					</Box>
				</Stack>
			</SimpleGrid>

			{/* Top tags + Top lists */}
			<SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
				<Stack gap="xs">
					<SectionHeader label="Top tags" />
					<Box
						style={{
							borderRadius: 10,
							border: "1px solid var(--mantine-color-dark-4)",
							padding: "14px 16px",
							background: "var(--mantine-color-dark-7)",
						}}
					>
						{data.topTags.length === 0 ? (
							<Text size="sm" c="dimmed">No tags in this period</Text>
						) : (
							<Stack gap={6}>
								{data.topTags.map(({ tag, count }) => (
									<Group key={tag} justify="space-between">
										<Group gap={6}>
											<IconTag size={12} style={{ color: "var(--mantine-color-dimmed)" }} />
											<Text size="sm">{tag}</Text>
										</Group>
										<Badge size="xs" variant="light" color="gray">{count}</Badge>
									</Group>
								))}
							</Stack>
						)}
					</Box>
				</Stack>

				<Stack gap="xs">
					<SectionHeader label="Top lists" />
					<Box
						style={{
							borderRadius: 10,
							border: "1px solid var(--mantine-color-dark-4)",
							padding: "14px 16px",
							background: "var(--mantine-color-dark-7)",
						}}
					>
						{data.topLists.length === 0 ? (
							<Text size="sm" c="dimmed">No list activity in this period</Text>
						) : (
							<Stack gap={6}>
								{data.topLists.map(({ name, savesAdded }) => (
									<Group key={name} justify="space-between">
										<Group gap={6}>
											<IconList size={12} style={{ color: "var(--mantine-color-dimmed)" }} />
											<Text size="sm">{name}</Text>
										</Group>
										<Badge size="xs" variant="light" color="violet">{savesAdded} save{savesAdded !== 1 ? "s" : ""}</Badge>
									</Group>
								))}
							</Stack>
						)}
					</Box>
				</Stack>
			</SimpleGrid>

			{/* Remembrals */}
			{data.remembrals.length > 0 && (
				<Stack gap="xs">
					<SectionHeader label="Remembrals" />
					<Box
						style={{
							borderRadius: 10,
							border: "1px solid var(--mantine-color-dark-4)",
							padding: "14px 16px",
							background: "var(--mantine-color-dark-7)",
						}}
					>
						<Stack gap={6}>
							{data.remembrals.map(({ name, date }) => (
								<Group key={`${name}-${date}`} justify="space-between">
									<Text size="sm">{name}</Text>
									<Text size="xs" c="dimmed">{dayjs(date).format("MMM D, YYYY")}</Text>
								</Group>
							))}
						</Stack>
					</Box>
				</Stack>
			)}
		</Stack>
	)
}

// ---------------------------------------------------------------------------
// Skeletons
// ---------------------------------------------------------------------------
export function ReportSkeleton() {
	return (
		<Stack gap="xl">
			<Stack gap="xs">
				<Skeleton height={12} width={80} />
				<SimpleGrid cols={{ base: 2, sm: 4 }} spacing="sm">
					{[1, 2, 3, 4].map((i) => <StatCardSkeleton key={i} />)}
				</SimpleGrid>
			</Stack>
			<Stack gap="xs">
				<Skeleton height={12} width={60} />
				<SimpleGrid cols={{ base: 2, sm: 3 }} spacing="sm">
					{[1, 2, 3].map((i) => <StatCardSkeleton key={i} />)}
				</SimpleGrid>
				<Skeleton height={120} radius={10} />
			</Stack>
			<Skeleton height={100} radius={10} />
			<Skeleton height={150} radius={10} />
		</Stack>
	)
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export function ReportPage() {
	const [range, setRange] = useState<RangeKey>("7d")
	const { start, end } = getRangeDates(range)
	const { data, isLoading, isError } = useReport(start, end)

	return (
		<Stack gap="lg">
			<Group justify="space-between" align="flex-end">
				<Stack gap={2}>
					<Text fw={700} size="xl">Report</Text>
					<Text size="sm" c="dimmed">Your activity at a glance</Text>
				</Stack>
				<Select
					data={RANGE_OPTIONS}
					value={range}
					onChange={(v) => v && setRange(v as RangeKey)}
					size="sm"
					w={160}
					allowDeselect={false}
				/>
			</Group>

			{isLoading && <ReportSkeleton />}
			{isError && (
				<Text c="red" size="sm">Failed to load report. Please try again.</Text>
			)}
			{data && <ReportContent data={data.data} range={range} />}
		</Stack>
	)
}
