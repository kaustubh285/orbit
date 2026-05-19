import ROUTES from "@/routes"
import { Box, Button, Group, SimpleGrid, Stack, Text } from "@mantine/core"
import {
	IconBookmark,
	IconFileText,
	IconList,
	IconPlus,
	IconRocket,
	IconTimeline,
} from "@tabler/icons-react"
import { useNavigate } from "@tanstack/react-router"
import { useOrbitAppStore } from "@/store/orbit-app.store"

const NAV_CARDS = [
	{ label: "Quests", description: "Todos, events & dailies", icon: IconRocket, to: ROUTES.QUESTS, accent: "ocean-blue", shade: 4 },
	{ label: "Notes", description: "Your notes & docs", icon: IconFileText, to: ROUTES.NOTES, accent: "gray", shade: 4 },
	{ label: "Saves", description: "Bookmarks & links", icon: IconBookmark, to: ROUTES.SAVES, accent: "amber", shade: 5 },
	{ label: "Lists", description: "Organised collections", icon: IconList, to: ROUTES.LISTS, accent: "violet", shade: 5 },
	{ label: "Timeline", description: "Memories over time", icon: IconTimeline, to: ROUTES.TIMELINE, accent: "pink", shade: 4 },
]

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

// ── Insight placeholder ───────────────────────────────────────────────────────

function InsightCard({ label, value }: { label: string; value: string }) {
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
				<Text fw={700} size="xl">{value}</Text>
			</Stack>
		</Box>
	)
}

export function HomeDashboard() {
	const setCreateNewOpen = useOrbitAppStore((s) => s.actions.setCreateNewOpen)

	return (
		<Stack gap="xl" pt="sm">
			<Group justify="space-between" align="flex-end">
				<Stack gap={2}>
					<Text fw={700} size="xl">Orbit</Text>
					<Text size="sm" c="dimmed">Your personal command centre</Text>
				</Stack>
				<Button
					leftSection={<IconPlus size={14} />}
					size="sm"
					onClick={() => setCreateNewOpen(true)}
				>
					New
				</Button>
			</Group>

			{/* Insights row — placeholder values until the data layer is wired */}
			<Stack gap="xs">
				<Text size="xs" c="dimmed" tt="uppercase" fw={600} style={{ letterSpacing: "0.08em" }}>Today</Text>
				<Group grow>
					<InsightCard label="Due today" value="—" />
					<InsightCard label="Completed" value="—" />
					<InsightCard label="Overdue" value="—" />
				</Group>
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
