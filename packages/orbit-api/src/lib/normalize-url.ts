const TRACKING_PARAMS = new Set([
	"igsh", "si", "fbclid", "gclid", "mc_cid", "mc_eid", "ref", "ref_src",
]);

function isTrackingParam(key: string): boolean {
	return TRACKING_PARAMS.has(key) || key.startsWith("utm_");
}

/**
 * Platform-specific canonicalization so the same content saved via different
 * share forms normalizes identically:
 *   youtu.be/ID, m.youtube.com/watch?v=ID, youtube.com/shorts/ID
 *     -> https://youtube.com/watch?v=ID
 *   www.instagram.com/reels/CODE/ -> https://instagram.com/reel/CODE
 */
function canonicalizePlatform(url: URL): URL {
	const host = url.hostname;

	if (host === "youtu.be") {
		const videoId = url.pathname.split("/")[1];
		if (videoId) {
			const canonical = new URL(`https://youtube.com/watch?v=${videoId}`);
			return canonical;
		}
	}

	if (host === "youtube.com" || host === "www.youtube.com" || host === "m.youtube.com") {
		url.hostname = "youtube.com";
		const shortsMatch = url.pathname.match(/^\/(?:shorts|live)\/([\w-]+)/);
		if (shortsMatch) {
			return new URL(`https://youtube.com/watch?v=${shortsMatch[1]}`);
		}
		if (url.pathname === "/watch") {
			// v is the identity of the video; everything else (t, list, pp) is context
			const v = url.searchParams.get("v");
			if (v) return new URL(`https://youtube.com/watch?v=${v}`);
		}
	}

	if (host === "instagram.com" || host === "www.instagram.com") {
		url.hostname = "instagram.com";
		url.pathname = url.pathname.replace(/^\/reels\//, "/reel/");
	}

	return url;
}

export function normalizeUrl(raw: string): string {
	try {
		let url = new URL(raw.trim());
		url.hostname = url.hostname.toLowerCase();
		url = canonicalizePlatform(url);
		if (url.pathname.length > 1 && url.pathname.endsWith("/")) {
			url.pathname = url.pathname.replace(/\/+$/, "");
		}
		for (const key of [...url.searchParams.keys()]) {
			if (isTrackingParam(key)) url.searchParams.delete(key);
		}
		url.searchParams.sort();
		return url.toString();
	} catch {
		return raw.trim();
	}
}
