import ROUTES from "@/routes";
import { AppShell, Burger, Button, Flex, Group } from "@mantine/core";
import { IconFileDatabase, IconNotebook } from "@tabler/icons-react";
import { useLocation, useNavigate } from "@tanstack/react-router";

export function AppHeader({ mobileOpened, toggleMobile, desktopOpened, toggleDesktop }: {
	mobileOpened: boolean,
	toggleMobile: () => void,
	desktopOpened: boolean,
	toggleDesktop: () => void,
}) {
	const navigate = useNavigate()
	const location = useLocation()

	return (
		<AppShell.Header>
			<Flex h="100%" px="md" justify="space-between" align="center">
				<Group >
					<Burger
						opened={mobileOpened}
						onClick={toggleMobile}
						hiddenFrom="sm"
						size="sm"
					/>
					<Burger
						opened={desktopOpened}
						onClick={toggleDesktop}
						visibleFrom="sm"
						size="sm"
					/>
					<div>Orbit</div>
				</Group>
				<Group>
					{location.pathname !== "/saves" ?
						<Button variant="default" onClick={() => navigate({ to: ROUTES.SAVES })} bg="indigo" leftSection={<IconFileDatabase size={16} />}></Button>
						:
						<Button variant="default" onClick={() => navigate({ to: ROUTES.HOME })} bg="cyan" leftSection={<IconNotebook size={16} />}></Button>
					}
				</Group>
			</Flex>
		</AppShell.Header>
	)
}
