import { PRIORITY_COLOR, TYPE_COLOR, TYPE_ICON } from "@/CONSTANTS"
import type { Quest } from "@/types"
import { ActionIcon, Badge, Skeleton, Stack, Text, TextInput } from "@mantine/core"
import { IconCheck, IconCircleDot, IconDots } from "@tabler/icons-react"
import { useState } from "react"

const QUEST_TYPES: Quest["type"][] = ["todo", "note", "event", "daily"]

function cycleType(current: Quest["type"]): Quest["type"] {
	const idx = QUEST_TYPES.indexOf(current)
	return QUEST_TYPES[(idx + 1) % QUEST_TYPES.length]
}

function TypeIcon({ type, onClick, size = 16 }: { type: Quest["type"]; onClick?: () => void; size?: number }) {
	const Icon = TYPE_ICON[type]
	const cssColor = `var(--mantine-color-${TYPE_COLOR[type]}-6)`
	return (
		<ActionIcon
			variant="subtle"
			color={TYPE_COLOR[type]}
			size="sm"
			onClick={onClick}
			style={{ flexShrink: 0, cursor: onClick ? "pointer" : "default" }}
		>
			<Icon size={size} color={cssColor} />
		</ActionIcon>
	)
}

function daysAgoLabel(iso: string): string {
	const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
	if (days === 0) return "today"
	if (days < 30) return `${days}d ago`
	const months = Math.floor(days / 30)
	return `${months}mo ago`
}

function QuestRow({
	quest,
	onToggle,
	onOpen,
}: {
	quest: Quest
	onToggle: (quest: Quest) => void
	onOpen: (quest: Quest) => void
}) {
	const isCompleted = quest.status === "completed"
	const isToggleable = quest.type === "todo" || quest.type === "daily"
	const showLastDone = (quest.type === "todo" || quest.type === "event") && quest.lastCompletedAt
	return (
		<div
			style={{
				display: "flex",
				alignItems: "center",
				gap: 8,
				padding: "6px 4px",
				borderBottom: "1px dotted var(--mantine-color-gray-4)",
				borderLeft: `3px solid var(--mantine-color-${TYPE_COLOR[quest.type]}-6)`,
				paddingLeft: 8,
			}}
		>
			<TypeIcon
				type={quest.type}
				onClick={isToggleable ? () => onToggle(quest) : undefined}
			/>
			<Text
				size="lg"
				td={isCompleted ? "line-through" : undefined}
				c={isCompleted ? "dimmed" : undefined}
				style={{ flex: 1 }}
			>
				{quest.title}
			</Text>
			{showLastDone && (
				<Badge
					color="green"
					variant="light"
					size="xs"
					style={{ flexShrink: 0 }}
					leftSection={<IconCheck size={10} />}
				>
					{daysAgoLabel(quest.lastCompletedAt!)}
				</Badge>
			)}
			{quest.priority && (
				<div
					style={{
						width: 8,
						height: 8,
						borderRadius: "50%",
						flexShrink: 0,
						backgroundColor: `var(--mantine-color-${PRIORITY_COLOR[quest.priority]}-6)`,
					}}
				/>
			)}
			<ActionIcon
				variant="subtle"
				color="gray"
				size="sm"
				onClick={() => onOpen(quest)}
			>
				<IconCircleDot size={8} />
			</ActionIcon>
		</div>
	)
}

function NewQuestRow({ onSubmit }: { onSubmit: (title: string, type: Quest["type"]) => void }) {
	const [type, setType] = useState<Quest["type"]>("todo")
	const [title, setTitle] = useState("")

	function submit() {
		if (!title.trim()) return
		onSubmit(title, type)
		setTitle("")
	}

	return (
		<div
			style={{
				display: "flex",
				alignItems: "center",
				gap: 8,
				padding: "1px 4px",
				borderBottom: "1px dotted var(--mantine-color-gray-4)",
			}}
		>
			<TypeIcon type={type} onClick={() => setType(cycleType(type))} />
			<TextInput
				// ref={inputRef}
				variant="unstyled"
				placeholder="New quest..."
				value={title}
				onChange={(e) => setTitle(e.currentTarget.value)}
				onKeyDown={(e) => { if (e.key === "Enter") submit() }}
				onBlur={submit}
				size="md"
				style={{ flex: 1 }}
				styles={{ input: { padding: 0, fontSize: "var(--mantine-font-size-md)" } }}
			/>
		</div>
	)
}

export default function ListQuestsComponent({
	quests,
	isLoading,
	onSubmit,
	onToggle,
	onOpen,
}: {
	quests: Quest[]
	isLoading: boolean
	onSubmit: (title: string, type: Quest["type"]) => void
	onToggle: (quest: Quest) => void
	onOpen: (quest: Quest) => void
}) {
	if (isLoading) {
		return (
			<Stack gap={0}>
				{[1, 2, 3].map((i) => (
					<Skeleton key={i} height={33} radius={0} mb={1} />
				))}
			</Stack>
		)
	}

	return (
		<div
			style={{
				borderBottom: "1px dotted var(--mantine-color-gray-4)",
				fontFamily: "inherit",
			}}
		>
			{quests.map((q) => (
				<QuestRow key={q.id} quest={q} onToggle={onToggle} onOpen={onOpen} />
			))}
			<NewQuestRow onSubmit={onSubmit} />
		</div>
	)
}
