export const PRESET_COLORS = [
	'red', 'orange', 'yellow', 'green', 'teal',
	'blue', 'indigo', 'violet', 'grape', 'pink',
] as const

export type ListColor = typeof PRESET_COLORS[number]

export function listAccentColor(color: string | null): string {
	return color
		? `var(--mantine-color-${color}-6)`
		: 'var(--mantine-color-gray-5)'
}
