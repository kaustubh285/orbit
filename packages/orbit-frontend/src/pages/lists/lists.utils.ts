export const PRESET_COLORS = [
	'red', 'orange', 'yellow', 'green', 'teal',
	'blue', 'indigo', 'violet', 'grape', 'pink',
] as const

export type ListColor = typeof PRESET_COLORS[number]

export function listAccentColor(color: string | null): string {
	if (!color) return 'var(--mantine-color-gray-5)'
	// Raw CSS color value (hex, rgb, hsl) — stored directly
	if (color.startsWith('#') || color.startsWith('rgb') || color.startsWith('hsl')) return color
	// Legacy Mantine color name — kept for backwards compat with existing data
	return `var(--mantine-color-${color}-6)`
}
