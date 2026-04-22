export const MAX_TITLE_LEN = 500
export const MAX_DESCRIPTION_LEN = 2000
export const MAX_AUTHOR_LEN = 200

// Collapse control chars + whitespace runs, trim, cap length. Returns null for
// empty input — prevents a malicious or broken site from filling the DB with
// garbage values that also then fan out into the UI.
export function sanitizeText(value: string | null | undefined, maxLen: number): string | null {
	if (value == null) return null
	// biome-ignore lint/suspicious/noControlCharactersInRegex: intentional — stripping control chars
	const cleaned = value
		.replace(/[\x00-\x1F\x7F]/g, " ")
		.replace(/\s+/g, " ")
		.trim()
		.slice(0, maxLen)
	return cleaned.length > 0 ? cleaned : null
}

// Only accept http(s) URLs. Blocks javascript:, data:, vbscript:, and anything
// that could break out of the CSS url(...) / img src contexts on the frontend.
export function sanitizeHttpUrl(value: string | null | undefined): string | null {
	if (!value) return null
	try {
		const u = new URL(value)
		if (u.protocol !== "http:" && u.protocol !== "https:") return null
		return u.href
	} catch {
		return null
	}
}
