import { CheckIcon, Combobox, Group, Pill, PillsInput, useCombobox } from '@mantine/core';
import { useState } from 'react';

interface MultiSelectCreatableProps {
	options: string[];
	value: string[];
	onChange: (value: string[]) => void;
	placeholder?: string;
}

export function MultiSelectCreatable({ options, value, onChange, placeholder = 'Search tags' }: MultiSelectCreatableProps) {
	const combobox = useCombobox({
		onDropdownClose: () => combobox.resetSelectedOption(),
		onDropdownOpen: () => combobox.updateSelectedOptionIndex('active'),
	});

	const [search, setSearch] = useState('');
	const [data, setData] = useState(options);

	const exactOptionMatch = data.some((item) => item === search);

	const handleValueSelect = (val: string) => {
		setSearch('');

		if (val === '$create') {
			setData((current) => [...current, search]);
			onChange([...value, search]);
		} else {
			onChange(
				value.includes(val) ? value.filter((v) => v !== val) : [...value, val]
			);
		}
	};

	const handleValueRemove = (val: string) =>
		onChange(value.filter((v) => v !== val));

	const pills = value.map((item) => (
		<Pill key={item} withRemoveButton onRemove={() => handleValueRemove(item)}>
			{item}
		</Pill>
	));

	const optionItems = data
		.filter((item) => item.toLowerCase().includes(search.trim().toLowerCase()))
		.map((item) => (
			<Combobox.Option value={item} key={item} active={value.includes(item)}>
				<Group gap="sm">
					{value.includes(item) ? <CheckIcon size={12} /> : null}
					<span>{item}</span>
				</Group>
			</Combobox.Option>
		));

	return (
		<Combobox store={combobox} onOptionSubmit={handleValueSelect} withinPortal={false}>
			<Combobox.DropdownTarget>
				<PillsInput onClick={() => combobox.openDropdown()}>
					<Pill.Group>
						{pills}

						<Combobox.EventsTarget>
							<PillsInput.Field
								onFocus={() => combobox.openDropdown()}
								onBlur={() => combobox.closeDropdown()}
								value={search}
								placeholder={placeholder}
								onChange={(event) => {
									combobox.updateSelectedOptionIndex();
									setSearch(event.currentTarget.value);
								}}
								onKeyDown={(event) => {
									if (event.key === 'Backspace' && search.length === 0 && value.length > 0) {
										event.preventDefault();
										handleValueRemove(value[value.length - 1]);
									}
								}}
							/>
						</Combobox.EventsTarget>
					</Pill.Group>
				</PillsInput>
			</Combobox.DropdownTarget>

			<Combobox.Dropdown>
				<Combobox.Options>
					{optionItems}

					{!exactOptionMatch && search.trim().length > 0 && (
						<Combobox.Option value="$create">+ Create {search}</Combobox.Option>
					)}

					{exactOptionMatch && search.trim().length > 0 && optionItems.length === 0 && (
						<Combobox.Empty>Nothing found</Combobox.Empty>
					)}
				</Combobox.Options>
			</Combobox.Dropdown>
		</Combobox>
	);
}
