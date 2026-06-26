import { useUpdateSaveHook } from "@/hooks/use-update-save.hook"
import type { Save } from "@/types"
import {
	ActionIcon,
	Badge,
	Box,
	Button,
	Divider,
	Drawer,
	Group,
	Pill,
	ScrollArea,
	Select,
	Stack,
	Switch,
	Text,
	Textarea,
	TextInput,
	Tooltip,
} from "@mantine/core"
import {
	IconBrandInstagram,
	IconBrandReddit,
	IconBrandYoutube,
	IconEditCircle,
	IconExternalLink,
	IconSparkles2,
	IconTrashFilled,
	IconWorld,
	IconX,
	IconSparkles,
} from "@tabler/icons-react"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import { useEffect, useState } from "react"
import { MultiSelectCreatable } from "../multi-select-creatable.component"
import { PrivacyAwareText } from "../privacy-aware-text.component"
import { useMediaQuery } from "@mantine/hooks"

dayjs.extend(relativeTime)

const PLATFORM_META: Record<Save["sourcePlatform"], { label: string; color: string; Icon: React.ElementType }> = {
	youtube: { label: "YouTube", color: "red", Icon: IconBrandYoutube },
	reddit: { label: "Reddit", color: "orange", Icon: IconBrandReddit },
	instagram: { label: "Instagram", color: "grape", Icon: IconBrandInstagram },
	web: { label: "Web", color: "cyan", Icon: IconWorld },
}

export const SaveDetailView = ({
	save,
	opened,
	onClose,
}: {
	save: Save
	opened: boolean
	onClose: () => void
}) => {
	const { updateSave, isUpdating } = useUpdateSaveHook()

	const [title, setTitle] = useState(save.title ?? "")
	const [description, setDescription] = useState(save.description ?? "")
	const [note, setNote] = useState(save.note ?? "")
	const [status, setStatus] = useState<Save["status"]>(save.status)
	const [tags, setTags] = useState<string[]>(save.tags)
	const [shouldAISummaries, setShouldAISummaries] = useState(save.shouldAISummaries ?? false)
	const [aiSummary, setAiSummary] = useState(save.aiSummary ?? "")
	const [editMode, setEditMode] = useState(false)
	const isDesktop = useMediaQuery("(min-width: 48em)", false, { getInitialValueInEffect: false })
	const [showOriginalTitle, setShowOriginalTitle] = useState(false)
	useEffect(() => {
		setTitle(save.aiTitle ?? save.title ?? "")
		setDescription(save.description ?? "")
		setNote(save.note ?? "")
		setStatus(save.status)
		setTags(save.tags)
		setShouldAISummaries(save.shouldAISummaries ?? false)
		setAiSummary(save.aiSummary ?? "")
		setEditMode(false)
	}, [save.id])

	function handleSave() {
		updateSave(save.id, {
			title: title.trim() || null,
			description: description.trim() || null,
			note: note.trim() || null,
			tags,
			status,
			shouldAISummaries,
			aiSummary: aiSummary.trim() || null,
		})
		setEditMode(false)
	}

	const meta = PLATFORM_META[save.sourcePlatform]
	const PlatformIcon = meta.Icon

	return (
		<Drawer
			position={isDesktop ? "right" : "bottom"}
			opened={opened}
			onClose={onClose}
			size="xl"
			withCloseButton={false}
			padding={0}
			radius="md"
			styles={{
				body: {
					display: "flex",
					flexDirection: "column",
					height: "100%",
					overflow: "hidden",
					padding: 0,
				},
			}}
		>
			{/* Header */}
			<Group
				px="md"
				py="sm"
				style={{
					borderBottom: "1px solid var(--mantine-color-default-border)",
					flexShrink: 0,
				}}
			>



				<Tooltip label="Retrigger AI summary">
					<ActionIcon variant="subtle" color="gray" disabled>
						<IconSparkles2 size={16} />
					</ActionIcon>
				</Tooltip>

				<Tooltip label="Delete">
					<ActionIcon variant="subtle" color="red" disabled>
						<IconTrashFilled size={16} />
					</ActionIcon>
				</Tooltip>


				<Badge variant="dot" color={status === "active" ? "green" : "gray"} size="xs">
					{status}
				</Badge>

				<Group gap={4} ml="auto">
					<Tooltip label="Open source">
						<ActionIcon
							component="a"
							href={save.sourceUrl}
							target="_blank"
							rel="noopener noreferrer"
							variant="subtle"
							color="gray"
						>
							<IconExternalLink size={16} />
						</ActionIcon>
					</Tooltip>

					<Tooltip label="Edit">
						<ActionIcon
							variant={editMode ? "light" : "subtle"}
							color={editMode ? "amber" : "gray"}
							onClick={() => setEditMode((v) => !v)}
						>
							<IconEditCircle size={16} />
						</ActionIcon>
					</Tooltip>

					<ActionIcon variant="subtle" color="gray" onClick={onClose}>
						<IconX size={16} />
					</ActionIcon>

				</Group>
			</Group>

			<ScrollArea style={{ flex: 1 }}>
				<Stack gap="md" p="md">
					{/* Thumbnail + hero metadata side by side */}
					<Group gap="md" align="flex-start" wrap="nowrap">
						{save.thumbnailUrl && (
							<Stack>

								<Badge
									size="xs"
									color={meta.color}
									variant="light"
									leftSection={<PlatformIcon size={11} />}
								>
									{meta.label}
								</Badge>

								<Box
									style={{
										width: 140,
										flexShrink: 0,
										aspectRatio: "1/1",
										backgroundImage: `url(${save.thumbnailUrl})`,
										backgroundSize: save.sourcePlatform === "instagram" ? "contain" : "cover",
										backgroundPosition: "center",
										backgroundRepeat: "no-repeat",
										backgroundColor: save.sourcePlatform === "instagram"
											? `var(--mantine-color-${meta.color}-1)`
											: "var(--mantine-color-default-border)",
										borderRadius: 8,
										overflow: "hidden",
									}}
								/>

							</Stack>
						)}

						<Stack gap={6} style={{ flex: 1, minWidth: 0 }}>

							{(save.author || save.publishedAt) && (
								<Group gap={4}>
									{save.author && <PrivacyAwareText size="xs" c="dimmed">{save.author}</PrivacyAwareText>}
									{save.author && save.publishedAt && <PrivacyAwareText size="xs" c="dimmed">·</PrivacyAwareText>}
									{save.publishedAt && <PrivacyAwareText size="xs" c="dimmed">{dayjs(save.publishedAt).fromNow()}</PrivacyAwareText>}
								</Group>
							)}

							<PrivacyAwareText size="xs" c="dimmed">Saved {dayjs(save.createdAt).fromNow()}</PrivacyAwareText>

							{tags.length > 0 && (
								<Group gap={4} wrap="wrap" mt={2}>
									{tags.map((tag) => (
										<Pill key={tag} c="black" bg="white" size="xs">{tag}</Pill>
									))}
								</Group>
							)}
						</Stack>
					</Group>
					<PrivacyAwareText fw={600} size="sm" style={{ lineHeight: 1.35 }}>
						{title || "—"}
					</PrivacyAwareText>

					{/* Source URL */}
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

					{/* View mode */}
					{!editMode ? (
						<Stack gap="md">
							{save.title && (
								<>
									<Stack gap={2}>
										<Text size="xs" c="dimmed" tt="uppercase" fw={600} style={{ letterSpacing: "0.05em" }}>Original title</Text>
										<PrivacyAwareText size="sm" fs="italic" c="blue.7">{save.title}</PrivacyAwareText>
									</Stack>
									<Divider />
								</>
							)}
							{aiSummary && (
								<>
									<Stack gap={2}>
										<Group gap={6} align="center">
											<IconSparkles size={13} style={{ color: "var(--mantine-color-violet-4)" }} />
											<Text size="xs" c="dimmed" tt="uppercase" fw={600} style={{ letterSpacing: "0.05em" }}>AI Summary</Text>
											{save.aiEnrichedAt && (
												<Text size="xs" c="dimmed" ml="auto">enriched {dayjs(save.aiEnrichedAt).fromNow()}</Text>
											)}
										</Group>
										<PrivacyAwareText size="sm" c="dimmed" fs="italic">{aiSummary}</PrivacyAwareText>
									</Stack>
									<Divider />
								</>
							)}
							{note && (
								<>
									<Stack gap={2}>
										<Text size="xs" c="dimmed" tt="uppercase" fw={600} style={{ letterSpacing: "0.05em" }}>Your note</Text>
										<PrivacyAwareText size="sm" fs="italic" c="yellow.7">{note}</PrivacyAwareText>
									</Stack>
									<Divider />
								</>
							)}

							{description && (
								<Stack gap={2}>
									<Text size="xs" c="dimmed" tt="uppercase" fw={600} style={{ letterSpacing: "0.05em" }}>Description</Text>
									<PrivacyAwareText component="pre" size="sm" c="dimmed" w={"auto"} style={{
										textWrap: "wrap"
									}}>{description}</PrivacyAwareText>
								</Stack>
							)}

							{save.lists && save.lists.length > 0 && (
								<>
									<Divider />
									<Stack gap={2}>
										<Text size="xs" c="dimmed" tt="uppercase" fw={600} style={{ letterSpacing: "0.05em" }}>Lists</Text>
										<Group gap={4}>
											{save.lists.map((list) => (
												<Badge key={list} size="md" variant="light" color="gray">{list}</Badge>
											))}
										</Group>
									</Stack>
								</>
							)}
						</Stack>
					) : (
						/* Edit mode */
						<Stack gap="md">
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

							<Divider />

							<Textarea
								label="Note"
								value={note}
								onChange={(e) => setNote(e.currentTarget.value)}
								placeholder="Why did you save this?"
								autosize
								minRows={2}
								maxRows={4}
							/>

							<MultiSelectCreatable
								options={save.tags}
								value={tags}
								onChange={setTags}
								placeholder="Add tags"
							/>

							<Switch
								label="Enable AI summary"
								description="When on, AI will generate a summary for this save"
								checked={shouldAISummaries}
								onChange={(e) => setShouldAISummaries(e.currentTarget.checked)}
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
								<Button variant="subtle" color="gray" onClick={() => setEditMode(false)}>
									Cancel
								</Button>
								<Button color="amber" loading={isUpdating} onClick={handleSave}>
									Save changes
								</Button>
							</Group>
						</Stack>
					)}
				</Stack>
			</ScrollArea>
		</Drawer>
	)
}
