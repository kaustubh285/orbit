import ROUTES from "@/routes";
import { Burger, Button, Flex, Group } from "@mantine/core";
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
				<div>Logo</div>
			</Group>
			<Group>
				<Button variant="default" bg={location.pathname !== "/saves" ? "indigo" : "cyan"} onClick={() => navigate(location.pathname !== "/saves" ? { to: ROUTES.SAVES } : { to: ROUTES.HOME })}>{location.pathname !== "/saves" ? "Saves" : "Quests"}</Button>
			</Group>
		</Flex>
	)
}
