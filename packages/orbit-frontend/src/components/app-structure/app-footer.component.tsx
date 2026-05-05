import ROUTES from "@/routes"
import { AppShell, Group, Text, UnstyledButton } from "@mantine/core"
import { IconBookmark, IconFileText, IconList, IconRocket, IconTimeline } from "@tabler/icons-react"
import { useLocation, useNavigate } from "@tanstack/react-router"

const NAV_ITEMS = [
	{ label: "Quests", icon: IconRocket, to: ROUTES.HOME, accent: "ocean-blue", shade: 4 },
	{ label: "Notes", icon: IconFileText, to: ROUTES.NOTES, accent: "gray", shade: 4 },
	{ label: "Saves", icon: IconBookmark, to: ROUTES.SAVES, accent: "amber", shade: 5 },
	{ label: "Lists", icon: IconList, to: ROUTES.LISTS, accent: "violet", shade: 5 },
	{ label: "Timeline", icon: IconTimeline, to: ROUTES.TIMELINE, accent: "pink", shade: 4 },
]

export function AppFooter() {
	const navigate = useNavigate()
	const location = useLocation()

	return (
		<AppShell.Footer style={{ borderTop: "1px solid var(--mantine-color-dark-4)", paddingBottom: "env(safe-area-inset-bottom)" }}>
			<Group h="100%" justify="space-around" align="center" px="sm" gap={0}>
				{NAV_ITEMS.map(({ label, icon: Icon, to, accent, shade }) => {
					const active = to === ROUTES.HOME
						? location.pathname === to
						: location.pathname.startsWith(to)
					return (
						<UnstyledButton
							key={to}
							onClick={() => navigate({ to })}
							style={{ flex: 1 }}
						>
							<div
								style={{
									display: "flex",
									flexDirection: "column",
									alignItems: "center",
									gap: 4,
									padding: "7px 8px",
									margin: "4px 6px",
									borderRadius: 12,
									background: active ? "var(--mantine-color-dark-6)" : "transparent",
									transition: "background 0.12s ease",
								}}
							>
								<Icon
									size={22}
									stroke={active ? 2.5 : 1.5}
									color={
										active
											? `var(--mantine-color-${accent}-${shade})`
											: "var(--mantine-color-dimmed)"
									}
								/>
								<Text
									size="xs"
									lh={1}
									fw={active ? 700 : 400}
									c={active ? `${accent}.${shade}` : "dimmed"}
								>
									{label}
								</Text>
							</div>
						</UnstyledButton>
					)
				})}
			</Group>
		</AppShell.Footer>
	)
}
