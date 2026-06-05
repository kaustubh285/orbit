import ROUTES from "@/routes"
import { AppShell, NavLink, Stack } from "@mantine/core"
import { IconBookmark, IconFileText, IconHome2, IconList, IconPlus, IconRocket, IconTimeline } from "@tabler/icons-react"
import { useLocation, useNavigate } from "@tanstack/react-router"
import { useOrbitAppStore } from "@/store/orbit-app.store"

const NAV_ITEMS = [
	{ label: "Home", icon: IconHome2, to: ROUTES.HOME, accent: "teal", shade: 9 },
	{ label: "Quests", icon: IconRocket, to: ROUTES.QUESTS, accent: "ocean-blue", shade: 9 },
	{ label: "Lists", icon: IconList, to: ROUTES.LISTS, accent: "violet", shade: 9 },
	{ label: "Saves", icon: IconBookmark, to: ROUTES.SAVES, accent: "amber", shade: 9 },
	{ label: "Timeline", icon: IconTimeline, to: ROUTES.TIMELINE, accent: "pink", shade: 9 },
	{ label: "Notes", icon: IconFileText, to: ROUTES.NOTES, accent: "gray", shade: 8 },
]

export function AppNavbar() {
	const navigate = useNavigate()
	const location = useLocation()
	const setCreateNewOpen = useOrbitAppStore((s) => s.actions.setCreateNewOpen)

	return (
		<AppShell.Navbar p="xs">
			<Stack gap={4} mt="sm">
				<NavLink
					label="New"
					leftSection={<IconPlus size={18} stroke={2} />}
					onClick={() => setCreateNewOpen(true)}
					color="blue"
					styles={{ root: { borderRadius: 8 } }}
				/>

				{/*<Text size="xs" c="dimmed" fw={600} px="xs" mb={4} tt="uppercase" style={{ letterSpacing: "0.08em" }}>
					Orbit
				</Text>*/}

				{NAV_ITEMS.map(({ label, icon: Icon, to, accent, shade }) => {
					const active = label === "Home" ? location.pathname === "/" : location.pathname.startsWith(to)

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
