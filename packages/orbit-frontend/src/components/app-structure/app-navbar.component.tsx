import { AppShell, Burger, Group, Text } from "@mantine/core";
import { IconFileDatabase, IconHome, IconNotebook, IconSettings } from "@tabler/icons-react";
import { Link } from "@tanstack/react-router";

// NOT USED CURRENTLY, MAYBE IN THE FUTURE FOR A DESKTOP SIDEBAR NAVIGATION
export function AppNavbar({ mobileOpened, toggleMobile, ScrollArea }: {
	mobileOpened: boolean,
	toggleMobile: () => void,
	ScrollArea: any,
}) {
	const navLinks = [
		{ label: "Home", path: "/", icon: IconHome },
		{ label: "Quests", path: "/", icon: IconNotebook },
		{ label: "Saves", path: "/saves", icon: IconFileDatabase },
		{ label: "Settings", path: "/settings", icon: IconSettings },
	]
	return (
		<AppShell.Navbar>
			<AppShell.Section p="md">
				<Group justify="space-between">
					<div>Orbit</div>
					<Burger
						opened={mobileOpened}
						onClick={toggleMobile}
						hiddenFrom="sm"
						size="sm"
					/>
				</Group>
			</AppShell.Section>
			<AppShell.Section grow component={ScrollArea} p="md">
				{/*Nav links*/}
				{navLinks.map((link) => (
					<Link to={link.path} key={link.path} style={{ textDecoration: "none", color: "inherit" }} onClick={toggleMobile}>
						<Group align="center" mb="xs">
							<link.icon size={18} />
							<Text fz={18}>{link.label}</Text>
						</Group>
					</Link>
				))}
			</AppShell.Section>
			<AppShell.Section p="md">Nav footer</AppShell.Section>
		</AppShell.Navbar>
	)
}
