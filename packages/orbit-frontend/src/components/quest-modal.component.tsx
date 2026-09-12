import type { Quest } from "@/types"
import { useQuestsStore } from "@/store/quests.store"
import {
	ActionIcon, Button, Checkbox, Group, Modal,
	Select, Stack, Text, Textarea, TextInput,
} from "@mantine/core"
import { useDisclosure } from "@mantine/hooks"
import { DateTimePicker } from "@mantine/dates"
import { useForm } from "@mantine/form"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
	getQuestsOptions, getQuestsQueryKey,
	patchQuestsByIdMutation, postQuestsMutation,
} from "@orbit/client"
import { IconPlus } from "@tabler/icons-react"
import dayjs from "dayjs"
import { useState } from "react"

const TYPE_OPTIONS = [
	{ value: "todo", label: "Todo" },
	{ value: "note", label: "Note" },
	{ value: "event", label: "Event" },
	{ value: "daily", label: "Daily" },
]

const STATUS_OPTIONS = [
	{ value: "active", label: "Active" },
	{ value: "completed", label: "Completed" },
	{ value: "archived", label: "Archived" },
]

const PRIORITY_OPTIONS = [
	{ value: "urgent", label: "Urgent" },
	{ value: "important", label: "Important" },
	{ value: "quick_win", label: "Quick Win" },
	{ value: "deep_work", label: "Deep Work" },
	{ value: "someday", label: "Someday" },
	{ value: "waiting", label: "Waiting" },
]

function toDate(val: string | null | undefined): Date | null {
	return val ? new Date(val) : null
}

function toISO(val: Date | string | null): string | null {
	if (!val) return null
	if (typeof val === "string") return new Date(val).toISOString()
	return val.toISOString()
}

function isToday(date: Date | null) {
	return date ? dayjs(date).isSame(dayjs(), "day") : false
}

function DateQuickButtons({
	value,
	onChange,
}: {
	value: Date | null
	onChange: (date: Date) => void
}) {
	const today = dayjs().startOf("day").toDate()
	const tomorrow = dayjs().add(1, "day").startOf("day").toDate()
	const showToday = !isToday(value)
	const showTomorrow = !dayjs(value).isSame(dayjs().add(1, "day"), "day")

	return (
		<Group gap="xs">
			{showToday && (
				<Button size="compact-xs" variant="light" onClick={() => onChange(today)}>
					Today
				</Button>
			)}
			{showTomorrow && (
				<Button size="compact-xs" variant="light" onClick={() => onChange(tomorrow)}>
					Tomorrow
				</Button>
			)}
			{!showToday && !showTomorrow && (
				<Text size="xs" c="dimmed">Scheduled</Text>
			)}
		</Group>
	)
}

// ─── Sub-tasks modal ──────────────────────────────────────────────────────────

function SubTasksModal({
	parentQuest,
	opened,
	onClose,
}: {
	parentQuest: Quest
	opened: boolean
	onClose: () => void
}) {
	const selectedDate = useQuestsStore((s) => s.selectedDate)
	const queryClient = useQueryClient()
	const [newTitle, setNewTitle] = useState("")

	// Re-use the same query the home page already has in cache
	const dateStr = selectedDate ?? (parentQuest.dueAt ? parentQuest.dueAt.split("T")[0] : undefined)
	const { data: allQuests } = useQuery(getQuestsOptions({ query: { date: dateStr } }))
	const subTasks = (allQuests as Quest[] ?? []).filter((q) => q.parentId === parentQuest.id)

	const createSubTask = useMutation({
		...postQuestsMutation(),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: getQuestsQueryKey() }),
	})

	const updateSubTask = useMutation({
		...patchQuestsByIdMutation(),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: getQuestsQueryKey() }),
	})

	function handleAdd() {
		const trimmed = newTitle.trim()
		if (!trimmed) return
		createSubTask.mutate({
			body: { type: "todo", title: trimmed, parentId: parentQuest.id },
		} as Parameters<typeof createSubTask.mutate>[0])
		setNewTitle("")
	}

	function handleToggle(sub: Quest) {
		const newStatus = sub.status === "completed" ? "active" : "completed"
		updateSubTask.mutate({
			path: { id: sub.id },
			body: {
				status: newStatus,
				completedAt: newStatus === "completed" ? new Date().toISOString() : null,
			},
		} as Parameters<typeof updateSubTask.mutate>[0])
	}

	const done = subTasks.filter((s) => s.status === "completed").length

	return (
		<Modal
			opened={opened}
			onClose={onClose}
			title={
				<Stack gap={0}>
					<Text size="sm" fw={600}>Sub-tasks</Text>
					<Text size="xs" c="dimmed" lineClamp={1}>{parentQuest.title}</Text>
				</Stack>
			}
			size="sm"
		>
			<Stack gap="sm">
				{subTasks.length > 0 && (
					<Text size="xs" c="dimmed">{done} / {subTasks.length} done</Text>
				)}

				{subTasks.length === 0 && (
					<Text size="sm" c="dimmed">No sub-tasks yet.</Text>
				)}

				{subTasks.map((sub) => (
					<Group key={sub.id} gap="sm" wrap="nowrap">
						<Checkbox
							checked={sub.status === "completed"}
							onChange={() => handleToggle(sub)}
							size="sm"
						/>
						<Text
							size="sm"
							style={{ flex: 1 }}
							td={sub.status === "completed" ? "line-through" : undefined}
							c={sub.status === "completed" ? "dimmed" : undefined}
						>
							{sub.title}
						</Text>
					</Group>
				))}

				<Group gap="xs" mt={subTasks.length > 0 ? "xs" : 0} wrap="nowrap">
					<TextInput
						placeholder="Add a sub-task…"
						value={newTitle}
						onChange={(e) => setNewTitle(e.currentTarget.value)}
						onKeyDown={(e) => { if (e.key === "Enter") handleAdd() }}
						size="sm"
						style={{ flex: 1 }}
					/>
					<ActionIcon
						onClick={handleAdd}
						disabled={!newTitle.trim()}
						loading={createSubTask.isPending}
						size="lg"
					>
						<IconPlus size={16} />
					</ActionIcon>
				</Group>
			</Stack>
		</Modal>
	)
}

// ─── Quest form ───────────────────────────────────────────────────────────────

type FormValues = {
	title: string
	body: string
	type: Quest["type"]
	status: Quest["status"]
	priority: Quest["priority"]
	dueAt: Date | null
	startAt: Date | null
	endAt: Date | null
	location: string
	lastCompletedAt: Date | null
}

function QuestForm({
	quest,
	onClose,
	onSave,
}: {
	quest: Quest
	onClose: () => void
	onSave: (id: string, body: Partial<Omit<Quest, "id">>) => void
}) {
	const [subTasksOpened, { open: openSubTasks, close: closeSubTasks }] = useDisclosure(false)

	const form = useForm<FormValues>({
		mode: "controlled",
		initialValues: {
			title: quest.title,
			body: quest.body ?? "",
			type: quest.type,
			status: quest.status,
			priority: quest.priority,
			dueAt: toDate(quest.dueAt),
			startAt: toDate(quest.startAt),
			endAt: toDate(quest.endAt),
			location: quest.location ?? "",
			lastCompletedAt: toDate(quest.lastCompletedAt),
		},
	})

	function handleSave(values: FormValues) {
		onSave(quest.id, {
			title: values.title,
			body: values.body || null,
			type: values.type,
			status: values.status,
			priority: values.priority,
			dueAt: toISO(values.dueAt),
			startAt: toISO(values.startAt),
			endAt: toISO(values.endAt),
			location: values.location || null,
			lastCompletedAt: toISO(values.lastCompletedAt),
		})
		onClose()
	}

	return (
		<>
			<form onSubmit={form.onSubmit(handleSave)}>
				<Stack>
					<TextInput
						label="Title"
						key={form.key("title")}
						{...form.getInputProps("title")}
					/>
					<Group grow>
						<Select
							label="Type"
							data={TYPE_OPTIONS}
							key={form.key("type")}
							{...form.getInputProps("type")}
						/>
						<Select
							label="Status"
							data={STATUS_OPTIONS}
							key={form.key("status")}
							{...form.getInputProps("status")}
						/>
					</Group>
					<Select
						label="Priority"
						data={PRIORITY_OPTIONS}
						clearable
						placeholder="None"
						key={form.key("priority")}
						{...form.getInputProps("priority")}
					/>
					<Textarea
						label="Notes"
						autosize
						minRows={2}
						key={form.key("body")}
						{...form.getInputProps("body")}
					/>
					{form.values.type === "todo" && (
						<Stack gap={4}>
							<DateTimePicker
								label="Due"
								clearable
								key={form.key("dueAt")}
								{...form.getInputProps("dueAt")}
							/>
							<DateQuickButtons
								value={form.values.dueAt}
								onChange={(d) => form.setFieldValue("dueAt", d)}
							/>
						</Stack>
					)}
					{form.values.type === "event" && (
						<>
							<Stack gap={4}>
								<Group grow>
									<DateTimePicker
										label="Start"
										clearable
										key={form.key("startAt")}
										{...form.getInputProps("startAt")}
									/>
									<DateTimePicker
										label="End"
										clearable
										key={form.key("endAt")}
										{...form.getInputProps("endAt")}
									/>
								</Group>
								<DateQuickButtons
									value={form.values.startAt}
									onChange={(d) => {
										const duration = form.values.startAt && form.values.endAt
											? dayjs(form.values.endAt).diff(form.values.startAt)
											: 0
										form.setFieldValue("startAt", d)
										if (duration > 0) {
											form.setFieldValue("endAt", dayjs(d).add(duration).toDate())
										}
									}}
								/>
							</Stack>
							<TextInput
								label="Location"
								key={form.key("location")}
								{...form.getInputProps("location")}
							/>
						</>
					)}
					{form.values.type === "daily" && (
						<DateTimePicker
							label="Last Completed"
							clearable
							key={form.key("lastCompletedAt")}
							{...form.getInputProps("lastCompletedAt")}
						/>
					)}
					<Group justify="space-between" mt="xs">
						{quest.parentId === null && (
							<Button variant="subtle" size="sm" onClick={openSubTasks}>
								Sub-tasks
							</Button>
						)}
						<Group gap="xs" ml="auto">
							<Button variant="default" onClick={onClose}>Cancel</Button>
							<Button type="submit">Save</Button>
						</Group>
					</Group>
				</Stack>
			</form>

			{quest.parentId === null && (
				<SubTasksModal
					parentQuest={quest}
					opened={subTasksOpened}
					onClose={closeSubTasks}
				/>
			)}
		</>
	)
}

// ─── Public component ─────────────────────────────────────────────────────────

export function QuestModalComponent({
	quest,
	onClose,
	onSave,
}: {
	quest: Quest | null
	onClose: () => void
	onSave: (id: string, body: Partial<Omit<Quest, "id">>) => void
}) {
	return (
		<Modal opened={!!quest} onClose={onClose} title={quest?.title ?? "Quest"} size="md">
			{quest && (
				<QuestForm key={quest.id} quest={quest} onClose={onClose} onSave={onSave} />
			)}
		</Modal>
	)
}
