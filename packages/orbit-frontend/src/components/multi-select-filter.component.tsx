import { MultiSelect } from "@mantine/core"

type MultiSelectFilterProps = {
	options: string[]
	selected: string[]
	onSelect: (selected: string[]) => void
	placeholder?: string
}

export function MultiSelectFilter({ options, selected, onSelect, placeholder = "Filter by tags" }: MultiSelectFilterProps) {
	return (
		<MultiSelect
			placeholder={placeholder}
			data={options}
			value={selected}
			onChange={onSelect}
			size="sm"
			clearable
			searchable
		/>
	)
}
