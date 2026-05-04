import { TYPE_COLOR, TYPE_ICON } from "@/CONSTANTS"
import { useSyncPending } from "@/hooks/use-sync-pending.hook"
import { useOrbitAppStore, type PendingSubmission } from "@/store/orbit-app.store"
import { ActionIcon, Badge, Button, ButtonGroup, Group, Modal, Stack, Text } from "@mantine/core"
import { useDisclosure } from "@mantine/hooks"
import { IconBookmark, IconTrash } from "@tabler/icons-react"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"

dayjs.extend(relativeTime)

function PendingItem({ item, onRemove }: { item: PendingSubmission; onRemove: (id: string) => void }) {
	const isQuest = item.apiCallKey === "postQuest"
	const Icon = isQuest ? TYPE_ICON[item.payload.type] : IconBookmark
	const color = isQuest ? TYPE_COLOR[item.payload.type] : "amber"
	const label = isQuest ? item.payload.title : item.payload.sourceUrl

	return (
		<Group
			justify="space-between"
			wrap="nowrap"
			style={{
				padding: "8px 10px",
				borderRadius: 6,
				border: "1px solid var(--mantine-color-gray-3)",
			}}
		>
			<Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
				<Badge color={color} variant="light" size="sm" leftSection={<Icon size={10} />} style={{ flexShrink: 0 }}>
					{isQuest ? item.payload.type : "save"}
				</Badge>
				<Text size="sm" truncate style={{ flex: 1 }}>
					{label}
				</Text>
			</Group>
			<Group gap="xs" wrap="nowrap" style={{ flexShrink: 0 }}>
				<Text size="xs" c="dimmed">{dayjs(item.createdAt).fromNow()}</Text>
				<ActionIcon variant="subtle" color="red" size="sm" onClick={() => onRemove(item.id)} aria-label="Remove">
					<IconTrash size={13} />
				</ActionIcon>
			</Group>
		</Group>
	)
}

export function CachedItems() {
	const [opened, { open, close }] = useDisclosure(false)
	const cached = useOrbitAppStore((s) => s.pendingSubmissions)
	const { removePendingSubmission, clearPendingSubmissions } = useOrbitAppStore((s) => s.actions)

	if (!cached.length) return null

	return (
		<>
			<Modal
				opened={opened}
				onClose={close}
				title={
					<Group gap="xs">
						<Text fw={600}>Unsynced items</Text>
						<Badge color="orange" variant="filled" size="sm">{cached.length}</Badge>
					</Group>
				}
			>
				<Stack gap="xs">
					{cached.map((item) => (
						<PendingItem key={item.id} item={item} onRemove={removePendingSubmission} />
					))}
					<Group justify="space-between">
						<Button variant="filled" size="xs" onClick={() => useSyncPending()}>
							Sync Now
						</Button>
						<Button
							variant="subtle"
							color="red"
							size="xs"
							leftSection={<IconTrash size={12} />}
							onClick={() => { clearPendingSubmissions(); close() }}
							style={{ alignSelf: "flex-end" }}
						>
							Clear all
						</Button>
					</Group>
				</Stack>
			</Modal>

			<Button size="compact-xs" variant="light" color="orange" onClick={open} rightSection={<IconBookmark size={12} />}>
				{cached.length} unsynced
			</Button>
		</>
	)
}
