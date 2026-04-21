import type { Quest } from "@/types"
import { Button, Group, Modal, Select, Stack, Text, Textarea, TextInput } from "@mantine/core"
import { DateTimePicker } from "@mantine/dates"
import { useForm } from "@mantine/form"
import dayjs from "dayjs"

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

function toISO(val: Date | null): string | null {
	return val ? val.toISOString() : null
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
				<Group justify="flex-end" mt="xs">
					<Button variant="default" onClick={onClose}>Cancel</Button>
					<Button type="submit">Save</Button>
				</Group>
			</Stack>
		</form>
	)
}

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
