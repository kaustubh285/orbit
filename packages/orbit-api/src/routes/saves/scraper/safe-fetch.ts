import { lookup } from "node:dns/promises"

export const SCRAPE_TIMEOUT_MS = 10_000
export const MAX_RESPONSE_BYTES = 2 * 1024 * 1024
export const MAX_REDIRECTS = 5

const USER_AGENT =
	"OrbitBot/1.0 (+https://orbit.app/bot; link preview fetcher)"

const BLOCKED_HOSTNAMES = new Set(["localhost", "0.0.0.0", "::", "::1"])

// Private / loopback / link-local / unique-local ranges. Blocks SSRF against
// internal services and cloud metadata endpoints (e.g. 169.254.169.254).
function isPrivateIp(ip: string): boolean {
	if (/^127\./.test(ip)) return true
	if (/^10\./.test(ip)) return true
	if (/^192\.168\./.test(ip)) return true
	if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip)) return true
	if (/^169\.254\./.test(ip)) return true
	if (/^0\./.test(ip)) return true
	if (ip === "::1" || ip === "::") return true
	if (/^fe[89ab][0-9a-f]:/i.test(ip)) return true
	if (/^f[cd][0-9a-f]{2}:/i.test(ip)) return true
	return false
}

async function assertPublicUrl(rawUrl: string): Promise<void> {
	const parsed = new URL(rawUrl)
	if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
		throw new Error(`Blocked protocol: ${parsed.protocol}`)
	}
	const hostname = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, "")
	if (BLOCKED_HOSTNAMES.has(hostname)) {
		throw new Error(`Blocked hostname: ${hostname}`)
	}
	const isLiteralIp = /^[\d.]+$/.test(hostname) || hostname.includes(":")
	if (isLiteralIp) {
		if (isPrivateIp(hostname)) throw new Error(`Blocked private IP: ${hostname}`)
		return
	}
	// TOCTOU note: DNS could rebind between this lookup and the fetch below.
	// For full mitigation we'd need a custom http agent that pins the resolved
	// IP. This lookup still covers the common cases (typos, direct attempts).
	const addresses = await lookup(hostname, { all: true })
	for (const { address } of addresses) {
		if (isPrivateIp(address)) {
			throw new Error(`Blocked private IP resolved from ${hostname}: ${address}`)
		}
	}
}

export interface SafeFetchInit {
	headers?: Record<string, string>
}

const isRedirect = (status: number): boolean => status >= 300 && status < 400

// Manual redirect loop: we must re-validate the target of every hop, because a
// public URL could otherwise 302 us to http://127.0.0.1 or 169.254.169.254.
// The abort signal is shared across hops so the total budget is bounded.
async function safeFetch(url: string, init: SafeFetchInit = {}): Promise<Response> {
	const signal = AbortSignal.timeout(SCRAPE_TIMEOUT_MS)
	let currentUrl = url
	for (let hops = 0; hops <= MAX_REDIRECTS; hops++) {
		await assertPublicUrl(currentUrl)
		const res = await fetch(currentUrl, {
			headers: { "User-Agent": USER_AGENT, ...init.headers },
			signal,
			redirect: "manual",
		})
		const location = res.headers.get("location")
		if (!isRedirect(res.status) || !location) return res
		await res.body?.cancel()
		currentUrl = new URL(location, currentUrl).href
	}
	throw new Error(`too many redirects following ${url}`)
}

async function readBoundedBody(res: Response): Promise<string | null> {
	const declared = Number(res.headers.get("content-length") ?? "0")
	if (declared > MAX_RESPONSE_BYTES) return null
	if (!res.body) return null

	const reader = res.body.getReader()
	const chunks: Uint8Array[] = []
	let total = 0
	while (true) {
		const { done, value } = await reader.read()
		if (done) break
		total += value.length
		if (total > MAX_RESPONSE_BYTES) {
			await reader.cancel()
			return null
		}
		chunks.push(value)
	}
	return new TextDecoder().decode(Buffer.concat(chunks))
}

export async function fetchJson<T>(url: string, init?: SafeFetchInit): Promise<T | null> {
	const res = await safeFetch(url, init)
	if (!res.ok) return null
	const contentType = res.headers.get("content-type") ?? ""
	if (!contentType.includes("application/json")) return null
	return (await res.json()) as T
}

export async function fetchHtml(url: string, init?: SafeFetchInit): Promise<string | null> {
	const res = await safeFetch(url, init)
	if (!res.ok) return null
	const contentType = res.headers.get("content-type") ?? ""
	if (!contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
		return null
	}
	return readBoundedBody(res)
}
