import { useUpdateSaveHook } from "@/hooks/use-update-save.hook"
import type { Save } from "@/types"
import {
	Badge,
	Box,
	Button,
	Divider,
	Group,
	Modal,
	Select,
	Stack,
	Text,
	Textarea,
	TextInput,
} from "@mantine/core"

import {
	IconBrandInstagram,
	IconBrandReddit,
	IconBrandYoutube,
	IconExternalLink,
	IconWorld,
} from "@tabler/icons-react"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import { useEffect, useState } from "react"
import { MultiSelectCreatable } from "../multi-select-creatable.component"

dayjs.extend(relativeTime)

const PLATFORM_META: Record<Save["sourcePlatform"], { label: string; color: string; Icon: React.ElementType }> = {
	youtube: { label: "YouTube", color: "red", Icon: IconBrandYoutube },
	reddit: { label: "Reddit", color: "orange", Icon: IconBrandReddit },
	instagram: { label: "Instagram", color: "grape", Icon: IconBrandInstagram },
	web: { label: "Web", color: "cyan", Icon: IconWorld },
}

export const UpdateSaveModal = ({
	save,
	opened,
	onClose,
}: {
	save: Save
	opened: boolean
	onClose: () => void
}) => {
	const { updateSave, isUpdating } = useUpdateSaveHook()
	console.log(save)
	const [title, setTitle] = useState(save.title ?? "")
	const [description, setDescription] = useState(save.description ?? "")
	const [note, setNote] = useState(save.note ?? "")
	const [status, setStatus] = useState<Save["status"]>(save.status)
	const [tags, setTags] = useState<string[]>(save.tags)
	const [aiSummary, setAiSummary] = useState(save.aiSummary ?? "")

	useEffect(() => {
		setTitle(save.title ?? "")
		setDescription(save.description ?? "")
		setNote(save.note ?? "")
		setStatus(save.status)
		setTags(save.tags)
		setAiSummary(save.aiSummary ?? "")
	}, [save.id])

	function handleSave() {
		updateSave(save.id, {
			title: title.trim() || null,
			description: description.trim() || null,
			note: note.trim() || null,
			tags,
			status,
			aiSummary: aiSummary.trim() || null,
		})
		onClose()
	}

	const meta = PLATFORM_META[save.sourcePlatform]
	const PlatformIcon = meta.Icon

	return (
		<Modal
			opened={opened}
			onClose={onClose}
			title="Edit save"
			size="lg"
			radius="md"
		>
			<Stack gap="md">
				{/* Thumbnail */}
				{save.thumbnailUrl && (
					<Box
						style={{
							width: "100%",
							aspectRatio: "5/2",
							backgroundImage: `url(${save.thumbnailUrl})`,
							backgroundSize: "cover",
							backgroundPosition: "center",
							borderRadius: 8,
							overflow: "hidden",
						}}
					/>
				)}

				{/* Read-only metadata */}
				<Group gap="xs" align="center">
					<Badge
						size="sm"
						color={meta.color}
						variant="light"
						leftSection={<PlatformIcon size={11} />}
					>
						{meta.label}
					</Badge>
					{save.author && (
						<Text size="xs" c="dimmed">{save.author}</Text>
					)}
					{save.publishedAt && (
						<Text size="xs" c="dimmed">· {dayjs(save.publishedAt).fromNow()}</Text>
					)}
					<Text size="xs" c="dimmed" ml="auto">
						Saved {dayjs(save.createdAt).fromNow()}
					</Text>
				</Group>

				<Group gap={6} align="center">
					<Text size="xs" c="dimmed" style={{ wordBreak: "break-all", flex: 1 }}>
						{save.sourceUrl}
					</Text>
					<Button
						component="a"
						href={save.sourceUrl}
						target="_blank"
						rel="noopener noreferrer"
						variant="subtle"
						color="gray"
						size="compact-xs"
						rightSection={<IconExternalLink size={12} />}
					>
						Open
					</Button>
				</Group>

				<Divider />

				{/* Editable fields */}

				<MultiSelectCreatable options={save.tags} value={tags} onChange={setTags} placeholder="Add tags" />
				<TextInput
					label="Title"
					value={title}
					onChange={(e) => setTitle(e.currentTarget.value)}
					placeholder="No title"
				/>

				<Textarea
					label="Description"
					value={description}
					onChange={(e) => setDescription(e.currentTarget.value)}
					placeholder="No description"
					autosize
					minRows={2}
					maxRows={5}
				/>

				<Textarea
					label="Note"
					value={note}
					onChange={(e) => setNote(e.currentTarget.value)}
					placeholder="Why did you save this?"
					autosize
					minRows={2}
					maxRows={4}
				/>

				<Textarea
					label={
						<Group gap={6}>
							<Text size="sm" fw={500}>AI Summary</Text>
							{save.aiEnrichedAt && (
								<Text size="xs" c="dimmed">enriched {dayjs(save.aiEnrichedAt).fromNow()}</Text>
							)}
						</Group>
					}
					value={aiSummary}
					onChange={(e) => setAiSummary(e.currentTarget.value)}
					placeholder="No AI summary yet"
					autosize
					minRows={2}
					maxRows={5}
				/>

				<Select
					label="Status"
					value={status}
					onChange={(v) => setStatus((v ?? "active") as Save["status"])}
					data={[
						{ value: "active", label: "Active" },
						{ value: "archived", label: "Archived" },
					]}
					allowDeselect={false}
				/>

				<Group justify="flex-end" gap="sm" mt="xs">
					<Button variant="subtle" color="gray" onClick={onClose}>
						Cancel
					</Button>
					<Button color="amber" loading={isUpdating} onClick={handleSave}>
						Save changes
					</Button>
				</Group>
			</Stack>
		</Modal>
	)
}
