import ROUTES from "@/routes";
import { AppShell, Button, Flex, Group, Text } from "@mantine/core";
import { useNavigate } from "@tanstack/react-router";
import { Show, UserButton } from '@clerk/react'

export function AppHeader() {
	const navigate = useNavigate()

	return (
		<AppShell.Header>
			<Flex h="100%" px="md" justify="space-between" align="center">
				<Text fw={700} size="lg">Orbit</Text>
				<Group>
					<Show when="signed-out">
						<Button variant="default" onClick={() => navigate({ to: ROUTES.LOGIN })}>Sign In</Button>
					</Show>
					<Show when="signed-in">
						<UserButton />
					</Show>
				</Group>
			</Flex>
		</AppShell.Header>
	)
}
