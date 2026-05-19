import ROUTES from "@/routes"
import { AppShell, Group, Menu, Text, UnstyledButton } from "@mantine/core"
import { IconBookmark, IconFileText, IconList, IconMenu2, IconPlus, IconRocket, IconTimeline } from "@tabler/icons-react"
import { useLocation, useNavigate } from "@tanstack/react-router"
import { useOrbitAppStore } from "@/store/orbit-app.store"

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
	const setCreateNewOpen = useOrbitAppStore((s) => s.actions.setCreateNewOpen)

	const activeItem = NAV_ITEMS.find(({ to }) =>
		to === ROUTES.HOME ? location.pathname === to : location.pathname.startsWith(to)
	)

	return (
		<AppShell.Footer style={{ borderTop: "1px solid var(--mantine-color-dark-4)", paddingBottom: "env(safe-area-inset-bottom)" }}>
			<Group h="100%" justify="space-between" align="center" px="md">
				<Group gap={4}>
					{activeItem && (
						<>
							<activeItem.icon
								size={20}
								stroke={2}
								color={`var(--mantine-color-${activeItem.accent}-${activeItem.shade})`}
							/>
							<Text size="sm" fw={600} c={`${activeItem.accent}.${activeItem.shade}`}>
								{activeItem.label}
							</Text>
						</>
					)}
				</Group>

				<Menu position="top-end" withArrow shadow="md" width={180}>
					<Menu.Target>
						<UnstyledButton
							style={{
								display: "flex",
								alignItems: "center",
								gap: 6,
								padding: "8px 12px",
								borderRadius: 10,
								background: "var(--mantine-color-dark-6)",
							}}
						>
							<IconMenu2 size={20} color="var(--mantine-color-dimmed)" />
						</UnstyledButton>
					</Menu.Target>

					<Menu.Dropdown>
						<Menu.Item
							leftSection={<IconPlus size={16} />}
							onClick={() => setCreateNewOpen(true)}
							fw={600}
							color="blue"
						>
							New
						</Menu.Item>
						<Menu.Divider />
						{NAV_ITEMS.map(({ label, icon: Icon, to, accent, shade }) => {
							const active = to === ROUTES.HOME
								? location.pathname === to
								: location.pathname.startsWith(to)
							return (
								<Menu.Item
									key={to}
									leftSection={
										<Icon
											size={16}
											stroke={active ? 2.5 : 1.5}
											color={active ? `var(--mantine-color-${accent}-${shade})` : undefined}
										/>
									}
									onClick={() => navigate({ to })}
									style={{ fontWeight: active ? 600 : 400 }}
									color={active ? `${accent}.${shade}` : undefined}
								>
									{label}
								</Menu.Item>
							)
						})}
					</Menu.Dropdown>
				</Menu>
			</Group>
		</AppShell.Footer>
	)
}
