import ROUTES from "@/routes"
import { AppShell, ActionIcon, Group, Text, UnstyledButton } from "@mantine/core"
import { IconBookmark, IconFileText, IconHome2, IconList, IconPlus, IconRocket, IconTimeline } from "@tabler/icons-react"
import { useLocation, useNavigate } from "@tanstack/react-router"
import { useOrbitAppStore } from "@/store/orbit-app.store"

const NAV_ITEMS = [
	{ label: "Notes", icon: IconFileText, to: ROUTES.NOTES, accent: "gray", shade: 4 },
	{ label: "Timeline", icon: IconTimeline, to: ROUTES.TIMELINE, accent: "pink", shade: 4 },
	{ label: "Saves", icon: IconBookmark, to: ROUTES.SAVES, accent: "amber", shade: 5 },
	{ label: "Lists", icon: IconList, to: ROUTES.LISTS, accent: "violet", shade: 5 },
	{ label: "Quests", icon: IconRocket, to: ROUTES.QUESTS, accent: "ocean-blue", shade: 4 },
	{ label: "Home", icon: IconHome2, to: ROUTES.HOME, accent: "teal", shade: 4 },
]

export function AppFooter() {
	const navigate = useNavigate()
	const location = useLocation()
	const setCreateNewOpen = useOrbitAppStore((s) => s.actions.setCreateNewOpen)

	const activeItem = NAV_ITEMS.find(({ to }) => location.pathname.startsWith(to))
	return (
		<AppShell.Footer style={{ borderTop: "1px solid var(--mantine-color-dark-4)", paddingBottom: "env(safe-area-inset-bottom)" }}>
			<Group h="100%" justify="space-between" align="center" px="md" gap={0}>
				{NAV_ITEMS.map(({ label, icon: Icon, to, accent, shade }) => {
					const active = activeItem?.to === to
					return (
						<UnstyledButton
							key={to}
							onClick={() => navigate({ to })}
							style={{
								display: "flex",
								flexDirection: "column",
								alignItems: "center",
								gap: 2,
								padding: "6px 8px",
								borderRadius: 8,
								flex: 1,
							}}
						>
							<Icon
								size={20}
								stroke={active ? 2.5 : 1.5}
								color={active ? `var(--mantine-color-${accent}-${shade})` : "var(--mantine-color-dimmed)"}
							/>
							{active && (
								<Text size="10px" fw={600} c={`${accent}.${shade}`} lh={1}>
									{label}
								</Text>
							)}
						</UnstyledButton>
					)
				})}

				<ActionIcon
					variant="filled"
					color="blue"
					radius="md"
					size="lg"
					onClick={() => setCreateNewOpen(true)}
					style={{ flexShrink: 0 }}
				>
					<IconPlus size={18} />
				</ActionIcon>
			</Group>
		</AppShell.Footer>
	)
}
