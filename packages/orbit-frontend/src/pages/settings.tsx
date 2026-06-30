import { Stack, Title, Paper, Text, SegmentedControl, Loader, Center } from "@mantine/core"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getUsersMeOptions, getUsersMeQueryKey, patchUsersMeMutation } from "@orbit/client"

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
		</Stack>
	)
}
