import { Stack, Title, Paper, Text, SegmentedControl, Loader, Center, Group, Button, Code, CopyButton, ActionIcon, Tooltip } from "@mantine/core"
import { IconCopy, IconCheck, IconRefresh } from "@tabler/icons-react"
import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getUsersMeOptions, getUsersMeQueryKey, patchUsersMeMutation, postUsersMeCaptureTokenMutation } from "@orbit/client"

const AI_MODEL_OPTIONS = [
	{ value: "none", label: "No AI" },
	{ value: "sarvam", label: "Simple" },
	{ value: "haiku", label: "Good" },
]

export function SettingsPage() {
	const queryClient = useQueryClient()

	const { data: user, isLoading } = useQuery(getUsersMeOptions())

	const { mutate: updateMe } = useMutation({
		...patchUsersMeMutation(),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: getUsersMeQueryKey() }),
	})

	const [captureToken, setCaptureToken] = useState<string | null>(null)

	const { mutate: fetchToken, isPending: isFetchingToken } = useMutation({
		...postUsersMeCaptureTokenMutation(),
		onSuccess: (data) => setCaptureToken(data.captureToken),
	})

	const { mutate: rotateToken, isPending: isRotating } = useMutation({
		...postUsersMeCaptureTokenMutation(),
		onSuccess: (data) => setCaptureToken(data.captureToken),
	})

	if (isLoading) {
		return <Center h="100vh"><Loader /></Center>
	}

	return (
		<Stack p="xl" maw={480}>
			<Title order={2}>Settings</Title>

			<Paper withBorder p="md" radius="md">
				<Stack gap="xs">
					<Text fw={500}>AI Enrichment</Text>
					<Text size="sm" c="dimmed">
						Choose how saves are summarised. Simple uses Sarvam 105-B, Good uses Claude Haiku.
					</Text>
					<SegmentedControl
						data={AI_MODEL_OPTIONS}
						value={user?.aiModel ?? "sarvam"}
						onChange={(val) =>
							updateMe({ body: { aiModel: val as "none" | "sarvam" | "haiku" } })
						}
					/>
				</Stack>
			</Paper>

			<Paper withBorder p="md" radius="md">
				<Stack gap="xs">
					<Text fw={500}>iOS Shortcut capture token</Text>
					<Text size="sm" c="dimmed">
						Use this token in your "Save to Orbit" Shortcut as the <Code>x-capture-key</Code> header. Keep it secret — anyone with it can add saves and read your list names.
					</Text>

					{captureToken ? (
						<Group gap="xs" wrap="nowrap">
							<Code block style={{ flex: 1, wordBreak: "break-all" }}>
								{captureToken}
							</Code>
							<Stack gap="xs">
								<CopyButton value={captureToken} timeout={2000}>
									{({ copied, copy }) => (
										<Tooltip label={copied ? "Copied!" : "Copy"} withArrow>
											<ActionIcon variant="light" color={copied ? "teal" : "gray"} onClick={copy}>
												{copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
											</ActionIcon>
										</Tooltip>
									)}
								</CopyButton>
								<Tooltip label="Generate a new token (invalidates the old one)" withArrow>
									<ActionIcon
										variant="light"
										color="orange"
										loading={isRotating}
										onClick={() => rotateToken({ body: { rotate: true } })}
									>
										<IconRefresh size={16} />
									</ActionIcon>
								</Tooltip>
							</Stack>
						</Group>
					) : (
						<Button
							variant="light"
							size="sm"
							w="fit-content"
							loading={isFetchingToken}
							onClick={() => fetchToken({ body: {} })}
						>
							Reveal token
						</Button>
					)}
				</Stack>
			</Paper>
		</Stack>
	)
}
