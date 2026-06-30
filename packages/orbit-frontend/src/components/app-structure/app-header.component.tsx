import ROUTES from "@/routes";
import { ActionIcon, AppShell, Avatar, Button, Flex, Group, Text, Tooltip } from "@mantine/core";
import { useNavigate } from "@tanstack/react-router";
import { Show, UserButton } from '@clerk/react'
import { IconEye, IconEyeClosed } from "@tabler/icons-react";
import { useOrbitAppStore } from "@/store/orbit-app.store";
import { useQuery } from "@tanstack/react-query";
import { getUsersMeOptions } from "@orbit/client";

const AI_MODEL_META: Record<"sarvam" | "haiku", { src: string; label: string }> = {
	sarvam: { src: "/sarvam.png", label: "AI: Simple (Sarvam)" },
	haiku: { src: "/claude.png", label: "AI: Good (Haiku)" },
}

export function AppHeader() {
	const navigate = useNavigate()

	const { privacyMode, actions } = useOrbitAppStore()
	const { data: user } = useQuery(getUsersMeOptions())

	const aiMeta = user?.aiModel && user.aiModel !== "none" ? AI_MODEL_META[user.aiModel] : null

	return (
		<AppShell.Header>
			<Flex h="100%" px="md" justify="space-between" align="center" style={{ paddingTop: "env(safe-area-inset-top)" }}>
				<Text onClick={() => navigate({ to: "/" })} fw={700} size="lg">Orbit</Text>
				<Group gap="xs">
					<ActionIcon variant="subtle" onClick={actions.togglePrivacyMode} aria-label="Toggle privacy mode">
						{privacyMode ? <IconEyeClosed size={18} /> : <IconEye size={18} />}
					</ActionIcon>
					{aiMeta && (
						<Tooltip label={aiMeta.label} withArrow>
							<Avatar
								src={aiMeta.src}
								size={28}
								radius="xl"
								style={{ cursor: "pointer" }}
								onClick={() => navigate({ to: ROUTES.SETTINGS })}
							/>
						</Tooltip>
					)}
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
