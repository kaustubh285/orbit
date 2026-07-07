import { describe, expect, test } from "bun:test";
import { normalizeUrl } from "./normalize-url.js";

describe("normalizeUrl", () => {
	test("strips tracking params", () => {
		expect(normalizeUrl("https://example.com/article?utm_source=x&utm_medium=y&fbclid=abc"))
			.toBe("https://example.com/article");
		expect(normalizeUrl("https://example.com/a?keep=1&gclid=z"))
			.toBe("https://example.com/a?keep=1");
	});

	test("lowercases host, strips trailing slash, sorts params", () => {
		expect(normalizeUrl("https://Example.COM/Path/")).toBe("https://example.com/Path");
		expect(normalizeUrl("https://example.com/a?b=2&a=1")).toBe("https://example.com/a?a=1&b=2");
	});

	test("keeps root path slash", () => {
		expect(normalizeUrl("https://example.com/")).toBe("https://example.com/");
	});

	test("returns trimmed input for non-URLs", () => {
		expect(normalizeUrl("  not a url  ")).toBe("not a url");
	});

	describe("instagram", () => {
		const canonical = "https://instagram.com/reel/DAbc123xYz";

		test("strips igsh share param", () => {
			expect(normalizeUrl("https://www.instagram.com/reel/DAbc123xYz/?igsh=MXY2ZnFm")).toBe(canonical);
		});

		test("www and non-www match", () => {
			expect(normalizeUrl("https://www.instagram.com/reel/DAbc123xYz/")).toBe(canonical);
			expect(normalizeUrl("https://instagram.com/reel/DAbc123xYz")).toBe(canonical);
		});

		test("/reels/ and /reel/ match", () => {
			expect(normalizeUrl("https://www.instagram.com/reels/DAbc123xYz/")).toBe(canonical);
		});

		test("posts keep their path", () => {
			expect(normalizeUrl("https://www.instagram.com/p/DAbc123xYz/?igsh=x")).toBe("https://instagram.com/p/DAbc123xYz");
		});
	});

	describe("youtube", () => {
		const canonical = "https://youtube.com/watch?v=dQw4w9WgXcQ";

		test("strips si share param", () => {
			expect(normalizeUrl("https://youtu.be/dQw4w9WgXcQ?si=AbCdEf")).toBe(canonical);
		});

		test("youtu.be, www, m., shorts and live all canonicalize to watch", () => {
			expect(normalizeUrl("https://youtu.be/dQw4w9WgXcQ")).toBe(canonical);
			expect(normalizeUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(canonical);
			expect(normalizeUrl("https://m.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(canonical);
			expect(normalizeUrl("https://www.youtube.com/shorts/dQw4w9WgXcQ")).toBe(canonical);
			expect(normalizeUrl("https://www.youtube.com/live/dQw4w9WgXcQ")).toBe(canonical);
		});

		test("drops timestamp and playlist context from watch URLs", () => {
			expect(normalizeUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s&list=PLx")).toBe(canonical);
		});

		test("non-watch youtube paths pass through", () => {
			expect(normalizeUrl("https://www.youtube.com/@SomeChannel/")).toBe("https://youtube.com/@SomeChannel");
		});
	});
});
