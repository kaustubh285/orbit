const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:9999"

const PROXIED_HOSTS = [".cdninstagram.com", ".fbcdn.net"]

function needsProxy(url: string): boolean {
	try {
		const { hostname } = new URL(url)
		return PROXIED_HOSTS.some((s) => hostname.endsWith(s))
	} catch {
		return false
	}
}

export function getThumbnailUrl(thumbnailUrl: string | null | undefined): string | undefined {
	if (!thumbnailUrl) return undefined
	if (needsProxy(thumbnailUrl)) {
		return `${API_BASE}/proxy/image?url=${encodeURIComponent(thumbnailUrl)}`
	}
	return thumbnailUrl
}
