import { MultiSelect } from "@mantine/core"

type MultiSelectFilterProps = {
	options: string[]
	selected: string[]
	onSelect: (selected: string[]) => void
}

export function MultiSelectFilter({ options, selected, onSelect }: MultiSelectFilterProps) {
	return (
		<MultiSelect
			placeholder="Filter by tags"
			data={options}
			value={selected}
			onChange={onSelect}
			size="sm"
			clearable
			searchable
		/>
	)
}
