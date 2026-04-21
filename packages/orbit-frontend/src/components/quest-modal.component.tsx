import type { Quest } from "@/types"
import { Button, Group, Modal, Select, Stack, Textarea, TextInput } from "@mantine/core"
import { DateTimePicker } from "@mantine/dates"
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

function toISO(val: Date | null): string | null {
	return val ? val.toISOString() : null
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
	const [title, setTitle] = useState(quest.title)
	const [body, setBody] = useState(quest.body ?? "")
	const [type, setType] = useState<Quest["type"]>(quest.type)
	const [status, setStatus] = useState<Quest["status"]>(quest.status)
	const [priority, setPriority] = useState<Quest["priority"]>(quest.priority)
	const [dueAt, setDueAt] = useState<Date | null>(toDate(quest.dueAt))
	const [startAt, setStartAt] = useState<Date | null>(toDate(quest.startAt))
	const [endAt, setEndAt] = useState<Date | null>(toDate(quest.endAt))
	const [location, setLocation] = useState(quest.location ?? "")
	const [lastCompletedAt, setLastCompletedAt] = useState<Date | null>(toDate(quest.lastCompletedAt))

	function handleSave() {
		onSave(quest.id, {
			title,
			body: body || null,
			type,
			status,
			priority,
			dueAt: toISO(dueAt),
			startAt: toISO(startAt),
			endAt: toISO(endAt),
			location: location || null,
			lastCompletedAt: toISO(lastCompletedAt),
		})
		onClose()
	}

	return (
		<Stack>
			<TextInput
				label="Title"
				value={title}
				onChange={(e) => setTitle(e.currentTarget.value)}
			/>
			<Group grow>
				<Select
					label="Type"
					data={TYPE_OPTIONS}
					value={type}
					onChange={(v) => v && setType(v as Quest["type"])}
				/>
				<Select
					label="Status"
					data={STATUS_OPTIONS}
					value={status}
					onChange={(v) => v && setStatus(v as Quest["status"])}
				/>
			</Group>
			<Select
				label="Priority"
				data={PRIORITY_OPTIONS}
				value={priority ?? null}
				onChange={(v) => setPriority(v as Quest["priority"])}
				clearable
				placeholder="None"
			/>
			<Textarea
				label="Notes"
				value={body}
				onChange={(e) => setBody(e.currentTarget.value)}
				autosize
				minRows={2}
			/>
			{type === "todo" && (
				<DateTimePicker
					label="Due"
					value={dueAt}
					onChange={setDueAt}
					clearable
				/>
			)}
			{type === "event" && (
				<>
					<Group grow>
						<DateTimePicker label="Start" value={startAt} onChange={setStartAt} clearable />
						<DateTimePicker label="End" value={endAt} onChange={setEndAt} clearable />
					</Group>
					<TextInput
						label="Location"
						value={location}
						onChange={(e) => setLocation(e.currentTarget.value)}
					/>
				</>
			)}
			{type === "daily" && (
				<DateTimePicker
					label="Last Completed"
					value={lastCompletedAt}
					onChange={setLastCompletedAt}
					clearable
				/>
			)}
			<Group justify="flex-end" mt="xs">
				<Button variant="default" onClick={onClose}>Cancel</Button>
				<Button onClick={handleSave}>Save</Button>
			</Group>
		</Stack>
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
