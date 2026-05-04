import ROUTES from "@/routes";
import { ActionIcon, AppShell, Button, Flex, Group, Text } from "@mantine/core";
import { useNavigate } from "@tanstack/react-router";
import { Show, UserButton } from '@clerk/react'
import { IconEye, IconEyeClosed } from "@tabler/icons-react";
import { useOrbitAppStore } from "@/store/orbit-app.store";

export function AppHeader() {
	const navigate = useNavigate()

	const { privacyMode, actions } = useOrbitAppStore()

	return (
		<AppShell.Header>
			<Flex h="100%" px="md" justify="space-between" align="center">
				<Text fw={700} size="lg">Orbit</Text>
				<Group>
					<ActionIcon variant="subtle" onClick={actions.togglePrivacyMode} aria-label="Toggle privacy mode">
						{privacyMode ? <IconEyeClosed size={18} /> : <IconEye size={18} />}
					</ActionIcon>
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
