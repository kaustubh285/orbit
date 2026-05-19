import ROUTES from "@/routes"
import { AppShell, NavLink, Stack, Text } from "@mantine/core"
import { IconBookmark, IconFileText, IconList, IconRocket, IconTimeline } from "@tabler/icons-react"
import { useLocation, useNavigate } from "@tanstack/react-router"

const NAV_ITEMS = [
	{ label: "Quests", icon: IconRocket, to: ROUTES.HOME, accent: "ocean-blue", shade: 4 },
	{ label: "Notes", icon: IconFileText, to: ROUTES.NOTES, accent: "gray", shade: 4 },
	{ label: "Saves", icon: IconBookmark, to: ROUTES.SAVES, accent: "amber", shade: 5 },
	{ label: "Lists", icon: IconList, to: ROUTES.LISTS, accent: "violet", shade: 5 },
	{ label: "Timeline", icon: IconTimeline, to: ROUTES.TIMELINE, accent: "pink", shade: 4 },
]

export function AppNavbar() {
	const navigate = useNavigate()
	const location = useLocation()

	return (
		<AppShell.Navbar p="xs">
			<Stack gap={4} mt="sm">
				<Text size="xs" c="dimmed" fw={600} px="xs" mb={4} tt="uppercase" style={{ letterSpacing: "0.08em" }}>
					Orbit
				</Text>
				{NAV_ITEMS.map(({ label, icon: Icon, to, accent, shade }) => {
					const active = to === ROUTES.HOME
						? location.pathname === to
						: location.pathname.startsWith(to)
					return (
						<NavLink
							key={to}
							label={label}
							leftSection={<Icon size={18} stroke={active ? 2.5 : 1.5} />}
							active={active}
							color={`${accent}.${shade}`}
							onClick={() => navigate({ to })}
							styles={{ root: { borderRadius: 8 } }}
						/>
					)
				})}
			</Stack>
		</AppShell.Navbar>
	)
}
