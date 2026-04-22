import ROUTES from "@/routes"
import { AppShell, Group, UnstyledButton, Stack, Text } from "@mantine/core"
import { IconHome, IconBookmark, IconSettings } from "@tabler/icons-react"
import { useLocation, useNavigate } from "@tanstack/react-router"

const NAV_ITEMS = [
	{ label: "Home", icon: IconHome, to: ROUTES.HOME },
	{ label: "Saves", icon: IconBookmark, to: ROUTES.SAVES },
	{ label: "Settings", icon: IconSettings, to: ROUTES.SETTINGS },
]

export function AppFooter() {
	const navigate = useNavigate()
	const location = useLocation()

	return (
		<AppShell.Footer>
			<Group h="100%" justify="space-around" align="center" px="md">
				{NAV_ITEMS.map(({ label, icon: Icon, to }) => {
					const active = location.pathname === to
					return (
						<UnstyledButton
							key={to}
							onClick={() => navigate({ to })}
							style={{ flex: 1 }}
						>
							<Stack gap={2} align="center">
								<Icon
									size={22}
									color={active ? "var(--mantine-color-ocean-blue-4)" : "var(--mantine-color-dimmed)"}
								/>
								<Text
									size="xs"
									c={active ? "ocean-blue.4" : "dimmed"}
									fw={active ? 600 : 400}
								>
									{label}
								</Text>
							</Stack>
						</UnstyledButton>
					)
				})}
			</Group>
		</AppShell.Footer>
	)
}
