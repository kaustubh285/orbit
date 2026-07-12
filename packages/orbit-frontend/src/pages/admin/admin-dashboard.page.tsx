import {
	Badge,
	Box,
	Button,
	Checkbox,
	Code,
	Group,
	Pagination,
	Select,
	SimpleGrid,
	Skeleton,
	Stack,
	Switch,
	Table,
	Tabs,
	Text,
	TextInput,
} from "@mantine/core"
import {
	IconArchive,
	IconMinus,
	IconRefresh,
	IconSearch,
	IconSquareRoundedCheckFilled,
	IconTrash,
	IconUser,
} from "@tabler/icons-react"
import dayjs from "dayjs"
import { useMemo, useState } from "react"
import type { Quest, Save } from "@/types"
import { PRIORITY_COLOR } from "@/CONSTANTS"
import { useReport } from "../report/use-report.hook"
import { ReportContent, ReportSkeleton, getRangeDates, RANGE_OPTIONS, type RangeKey } from "../report/report.page"
import {
	useAdminQuests,
	useAdminSaves,
	useArchiveQuests,
	useRestoreQuests,
	useDeleteSaves,
	useMe,
	useUpdateModel,
	useGetCaptureToken,
} from "./use-admin-dashboard.hook"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const STATUS_COLOR: Record<string, string> = {
	active: "blue",
	completed: "teal",
	archived: "gray",
}

const PLATFORM_COLOR: Record<string, string> = {
	youtube: "red",
	reddit: "orange",
	instagram: "grape",
	web: "cyan",
}

function fmt(date: string | null) {
	return date ? dayjs(date).format("MMM D, YYYY") : "—"
}

const PAGE_SIZE = 25

// ---------------------------------------------------------------------------
// Overview tab
// ---------------------------------------------------------------------------
function OverviewTab() {
	const [range, setRange] = useState<RangeKey>("7d")
	const { start, end } = getRangeDates(range)
	const { data, isLoading, isError } = useReport(start, end)

	return (
		<Stack gap="lg" pt="md">
			<Group justify="space-between" align="flex-end">
				<Stack gap={2}>
					<Text fw={600} size="lg">Report</Text>
					<Text size="sm" c="dimmed">Your activity at a glance</Text>
				</Stack>
				<Select size="sm" w={160} allowDeselect={false} value={range}
					onChange={(v) => v && setRange(v as RangeKey)}
					data={RANGE_OPTIONS}
				/>
			</Group>
			{isLoading && <ReportSkeleton />}
			{isError && <Text c="red" size="sm">Failed to load report. Please try again.</Text>}
			{data && <ReportContent data={data.data} range={range} />}
		</Stack>
	)
}

// ---------------------------------------------------------------------------
// Quests tab
// ---------------------------------------------------------------------------
function QuestsTab() {
	const { data: quests = [], isLoading } = useAdminQuests()
	const archive = useArchiveQuests()
	const restore = useRestoreQuests()
	const [selected, setSelected] = useState<Set<string>>(new Set())
	const [showArchived, setShowArchived] = useState(false)
	const [search, setSearch] = useState("")
	const [page, setPage] = useState(1)

	const filtered = useMemo(() => {
		let rows = showArchived ? quests : quests.filter((q) => q.status !== "archived")
		if (search) rows = rows.filter((q) => q.title.toLowerCase().includes(search.toLowerCase()))
		return rows
	}, [quests, showArchived, search])

	const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
	const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

	const allPageSelected = pageRows.length > 0 && pageRows.every((r) => selected.has(r.id))
	const somePageSelected = pageRows.some((r) => selected.has(r.id))

	function toggleAll() {
		setSelected((prev) => {
			const next = new Set(prev)
			if (allPageSelected) pageRows.forEach((r) => next.delete(r.id))
			else pageRows.forEach((r) => next.add(r.id))
			return next
		})
	}

	function toggle(id: string) {
		setSelected((prev) => {
			const next = new Set(prev)
			next.has(id) ? next.delete(id) : next.add(id)
			return next
		})
	}

	const selectedRows = quests.filter((q) => selected.has(q.id))
	const activeIds = selectedRows.filter((q) => q.status !== "archived").map((q) => q.id)
	const archivedIds = selectedRows.filter((q) => q.status === "archived").map((q) => q.id)

	async function handleArchive() {
		await archive.mutateAsync(activeIds)
		setSelected(new Set())
	}

	async function handleRestore() {
		await restore.mutateAsync(archivedIds)
		setSelected(new Set())
	}

	return (
		<Stack gap="sm" pt="md">
			<Group justify="space-between">
				<TextInput
					size="xs"
					placeholder="Search quests…"
					leftSection={<IconSearch size={13} />}
					value={search}
					onChange={(e) => { setSearch(e.currentTarget.value); setPage(1) }}
					w={220}
				/>
				<Group gap="xs">
					<Switch size="xs" label="Show archived" checked={showArchived} onChange={(e) => { setShowArchived(e.currentTarget.checked); setPage(1) }} />
					{activeIds.length > 0 && (
						<Button size="compact-sm" variant="light" color="gray" leftSection={<IconArchive size={13} />} loading={archive.isPending} onClick={handleArchive}>
							Archive {activeIds.length}
						</Button>
					)}
					{archivedIds.length > 0 && (
						<Button size="compact-sm" variant="light" color="teal" leftSection={<IconRefresh size={13} />} loading={restore.isPending} onClick={handleRestore}>
							Restore {archivedIds.length}
						</Button>
					)}
				</Group>
			</Group>

			{isLoading ? (
				<Stack gap="xs">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} height={36} radius="sm" />)}</Stack>
			) : (
				<Table striped highlightOnHover withTableBorder withColumnBorders verticalSpacing="xs" fz="sm">
					<Table.Thead>
						<Table.Tr>
							<Table.Th w={36}>
								<Checkbox size="xs" checked={allPageSelected} indeterminate={somePageSelected && !allPageSelected} onChange={toggleAll} />
							</Table.Th>
							<Table.Th>Title</Table.Th>
							<Table.Th w={90}>Type</Table.Th>
							<Table.Th w={110}>Status</Table.Th>
							<Table.Th w={120}>Priority</Table.Th>
							<Table.Th w={120}>Due</Table.Th>
							<Table.Th w={120}>Created</Table.Th>
						</Table.Tr>
					</Table.Thead>
					<Table.Tbody>
						{pageRows.length === 0 && (
							<Table.Tr>
								<Table.Td colSpan={7}>
									<Text size="sm" c="dimmed" ta="center" py="md">No quests found</Text>
								</Table.Td>
							</Table.Tr>
						)}
						{pageRows.map((q) => (
							<Table.Tr key={q.id} bg={selected.has(q.id) ? "var(--mantine-color-dark-6)" : undefined}>
								<Table.Td><Checkbox size="xs" checked={selected.has(q.id)} onChange={() => toggle(q.id)} /></Table.Td>
								<Table.Td>{q.title}</Table.Td>
								<Table.Td><Badge size="xs" variant="light">{q.type}</Badge></Table.Td>
								<Table.Td><Badge size="xs" variant="light" color={STATUS_COLOR[q.status]}>{q.status}</Badge></Table.Td>
								<Table.Td>
									{q.priority
										? <Badge size="xs" variant="light" color={PRIORITY_COLOR[q.priority]}>{q.priority.replace("_", " ")}</Badge>
										: <Text size="xs" c="dimmed">—</Text>
									}
								</Table.Td>
								<Table.Td><Text size="xs">{fmt(q.dueAt)}</Text></Table.Td>
								<Table.Td><Text size="xs">{fmt(q.createdAt ?? null)}</Text></Table.Td>
							</Table.Tr>
						))}
					</Table.Tbody>
				</Table>
			)}

			<Group justify="space-between">
				<Text size="xs" c="dimmed">{filtered.length} quest{filtered.length !== 1 ? "s" : ""}{selected.size > 0 ? ` · ${selected.size} selected` : ""}</Text>
				{totalPages > 1 && <Pagination size="xs" total={totalPages} value={page} onChange={setPage} />}
			</Group>
		</Stack>
	)
}

// ---------------------------------------------------------------------------
// Saves tab
// ---------------------------------------------------------------------------
function SavesTab() {
	const { data: saves = [], isLoading } = useAdminSaves()
	const deleteSaves = useDeleteSaves()
	const [selected, setSelected] = useState<Set<string>>(new Set())
	const [search, setSearch] = useState("")
	const [page, setPage] = useState(1)

	const filtered = useMemo(() => {
		if (!search) return saves
		const q = search.toLowerCase()
		return saves.filter((s) => (s.aiTitle ?? s.title ?? s.sourceUrl).toLowerCase().includes(q))
	}, [saves, search])

	const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
	const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

	const allPageSelected = pageRows.length > 0 && pageRows.every((r) => selected.has(r.id))
	const somePageSelected = pageRows.some((r) => selected.has(r.id))

	function toggleAll() {
		setSelected((prev) => {
			const next = new Set(prev)
			if (allPageSelected) pageRows.forEach((r) => next.delete(r.id))
			else pageRows.forEach((r) => next.add(r.id))
			return next
		})
	}

	function toggle(id: string) {
		setSelected((prev) => {
			const next = new Set(prev)
			next.has(id) ? next.delete(id) : next.add(id)
			return next
		})
	}

	async function handleDelete() {
		await deleteSaves.mutateAsync([...selected])
		setSelected(new Set())
	}

	return (
		<Stack gap="sm" pt="md">
			<Group justify="space-between">
				<TextInput
					size="xs"
					placeholder="Search saves…"
					leftSection={<IconSearch size={13} />}
					value={search}
					onChange={(e) => { setSearch(e.currentTarget.value); setPage(1) }}
					w={220}
				/>
				{selected.size > 0 && (
					<Button size="compact-sm" variant="light" color="red" leftSection={<IconTrash size={13} />} loading={deleteSaves.isPending} onClick={handleDelete}>
						Delete {selected.size}
					</Button>
				)}
			</Group>

			{isLoading ? (
				<Stack gap="xs">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} height={36} radius="sm" />)}</Stack>
			) : (
				<Table striped highlightOnHover withTableBorder withColumnBorders verticalSpacing="xs" fz="sm">
					<Table.Thead>
						<Table.Tr>
							<Table.Th w={36}>
								<Checkbox size="xs" checked={allPageSelected} indeterminate={somePageSelected && !allPageSelected} onChange={toggleAll} />
							</Table.Th>
							<Table.Th>Title</Table.Th>
							<Table.Th w={110}>Platform</Table.Th>
							<Table.Th w={100}>Status</Table.Th>
							<Table.Th w={180}>Tags</Table.Th>
							<Table.Th w={120}>Created</Table.Th>
							<Table.Th w={120}>AI Summary</Table.Th>
						</Table.Tr>
					</Table.Thead>
					<Table.Tbody>
						{pageRows.length === 0 && (
							<Table.Tr>
								<Table.Td colSpan={6}>
									<Text size="sm" c="dimmed" ta="center" py="md">No saves found</Text>
								</Table.Td>
							</Table.Tr>
						)}
						{pageRows.map((s) => (
							<Table.Tr key={s.id} bg={selected.has(s.id) ? "var(--mantine-color-dark-6)" : undefined}>
								<Table.Td><Checkbox size="xs" checked={selected.has(s.id)} onChange={() => toggle(s.id)} /></Table.Td>
								<Table.Td>
									<Text size="xs" lineClamp={1}>{s.aiTitle ?? s.title ?? s.sourceUrl}</Text>
								</Table.Td>
								<Table.Td><Badge size="xs" variant="light" color={PLATFORM_COLOR[s.sourcePlatform]}>{s.sourcePlatform}</Badge></Table.Td>
								<Table.Td><Badge size="xs" variant="light" color={STATUS_COLOR[s.status]}>{s.status}</Badge></Table.Td>
								<Table.Td>
									{s.tags?.length ? (
										<Group gap={4} wrap="wrap" style={{ overflow: "hidden" }}>
											{s.tags.slice(0, 3).map((t) => <Badge key={t} size="xs" variant="outline" color="gray">{t}</Badge>)}
											{s.tags.length > 3 && <Text size="xs" c="dimmed">+{s.tags.length - 3}</Text>}
										</Group>
									) : <Text size="xs" c="dimmed">—</Text>}
								</Table.Td>
								<Table.Td><Text size="xs">{fmt(s.createdAt)}</Text></Table.Td>
								<Table.Td><Text size="xs" c={s.aiSummary ? "teal" : "dimmed"}>{s.aiSummary ? "Yes" : "—"}</Text></Table.Td>
							</Table.Tr>
						))}
					</Table.Tbody>
				</Table>
			)}

			<Group justify="space-between">
				<Text size="xs" c="dimmed">{filtered.length} save{filtered.length !== 1 ? "s" : ""}{selected.size > 0 ? ` · ${selected.size} selected` : ""}</Text>
				{totalPages > 1 && <Pagination size="xs" total={totalPages} value={page} onChange={setPage} />}
			</Group>
		</Stack>
	)
}

// ---------------------------------------------------------------------------
// Account tab
// ---------------------------------------------------------------------------
function AccountTab() {
	const { data: user, isLoading } = useMe()
	const updateModel = useUpdateModel()
	const captureToken = useGetCaptureToken()
	const [token, setToken] = useState<string | null>(null)
	const [copied, setCopied] = useState(false)

	function handleCopy() {
		if (!token) return
		navigator.clipboard.writeText(token)
		setCopied(true)
		setTimeout(() => setCopied(false), 2000)
	}

	return (
		<Stack gap="lg" pt="md">
			{isLoading && <Skeleton height={120} radius={10} />}
			{user && (
				<>
					<Box style={{ borderRadius: 10, border: "1px solid var(--mantine-color-dark-4)", padding: "16px", background: "var(--mantine-color-dark-7)" }}>
						<Stack gap="sm">
							<Group gap={6}>
								<IconUser size={13} style={{ color: "var(--mantine-color-dimmed)" }} />
								<Text size="xs" c="dimmed" tt="uppercase" fw={600} style={{ letterSpacing: "0.08em" }}>Profile</Text>
							</Group>
							<SimpleGrid cols={2} spacing="sm">
								<TextInput label="Name" value={user.displayName ?? user.name} readOnly size="sm" />
								<TextInput label="Email" value={user.email} readOnly size="sm" />
							</SimpleGrid>
							<Select label="AI model" size="sm" w={200} allowDeselect={false} value={user.aiModel}
								onChange={(v) => v && updateModel.mutate(v)}
								data={[
									{ value: "none", label: "None" },
									{ value: "sarvam", label: "Sarvam" },
									{ value: "haiku", label: "Haiku" },
								]}
							/>
						</Stack>
					</Box>

					<Box style={{ borderRadius: 10, border: "1px solid var(--mantine-color-dark-4)", padding: "16px", background: "var(--mantine-color-dark-7)" }}>
						<Stack gap="sm">
							<Text size="xs" c="dimmed" tt="uppercase" fw={600} style={{ letterSpacing: "0.08em" }}>Capture token</Text>
							<Text size="xs" c="dimmed">Used to capture quests from external tools. Rotate if compromised.</Text>
							{token ? (
								<Group gap="xs">
									<Code style={{ flex: 1, fontSize: 11, wordBreak: "break-all" }}>{token}</Code>
									<Button size="compact-xs" variant="light" onClick={handleCopy}>{copied ? "Copied!" : "Copy"}</Button>
								</Group>
							) : (
								<Button size="sm" variant="light" w="fit-content" loading={captureToken.isPending}
									onClick={() => captureToken.mutate(false, { onSuccess: setToken })}>
									Reveal token
								</Button>
							)}
							{token && (
								<Button size="xs" variant="subtle" color="red" w="fit-content" leftSection={<IconRefresh size={13} />}
									loading={captureToken.isPending}
									onClick={() => captureToken.mutate(true, { onSuccess: setToken })}>
									Rotate token
								</Button>
							)}
						</Stack>
					</Box>
				</>
			)}
		</Stack>
	)
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function AdminDashboardPage() {
	return (
		<Box p="md">
			<Stack gap="xs">
				<Text fw={700} size="xl">Dashboard</Text>
				<Tabs defaultValue="overview">
					<Tabs.List>
						<Tabs.Tab value="overview">Overview</Tabs.Tab>
						<Tabs.Tab value="quests">Quests</Tabs.Tab>
						<Tabs.Tab value="saves">Saves</Tabs.Tab>
						<Tabs.Tab value="account">Account</Tabs.Tab>
					</Tabs.List>
					<Tabs.Panel value="overview" keepMounted={false}><OverviewTab /></Tabs.Panel>
					<Tabs.Panel value="quests" keepMounted={false}><QuestsTab /></Tabs.Panel>
					<Tabs.Panel value="saves" keepMounted={false}><SavesTab /></Tabs.Panel>
					<Tabs.Panel value="account" keepMounted={false}><AccountTab /></Tabs.Panel>
				</Tabs>
			</Stack>
		</Box>
	)
}
