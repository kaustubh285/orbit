import type { List } from '@/types'
import { ActionIcon, Menu } from '@mantine/core'
import { IconDots, IconEdit, IconTrash } from '@tabler/icons-react'

export function ListMenu({
	list,
	onEdit,
	onDelete,
}: {
	list: List
	onEdit: (list: List) => void
	onDelete: (id: string) => void
}) {
	return (
		<Menu position="bottom-end" withinPortal>
			<Menu.Target>
				<ActionIcon
					variant="subtle"
					color="gray"
					size="sm"
					onClick={(e) => e.stopPropagation()}
				>
					<IconDots size={14} />
				</ActionIcon>
			</Menu.Target>
			<Menu.Dropdown>
				<Menu.Item leftSection={<IconEdit size={14} />} onClick={() => onEdit(list)}>
					Edit
				</Menu.Item>
				<Menu.Item
					leftSection={<IconTrash size={14} />}
					color="red"
					onClick={() => onDelete(list.id)}
				>
					Delete
				</Menu.Item>
			</Menu.Dropdown>
		</Menu>
	)
}
