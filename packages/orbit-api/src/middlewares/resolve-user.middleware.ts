import { verifyToken } from "@clerk/backend";
import { eq } from "drizzle-orm";
import * as HttpStatusCodes from "stoker/http-status-codes";
import type { MiddlewareHandler } from "hono";
import { db } from "@/db/db.js";
import { usersTable } from "@/db/schemas/users.schema.js";
import type { AppBindings } from "@/lib/types.js";
import env from "@/env.js";

type CacheEntry = { userId: string; expiresAt: number };
const userCache = new Map<string, CacheEntry>();
const captureKeyCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60_000;

// Endpoints a capture token may call. Kept as an explicit allowlist so widening
// the token's power is always a deliberate edit here, never a side effect.
const CAPTURE_TOKEN_ALLOWLIST: ReadonlyArray<{ method: string; path: string }> = [
	{ method: "POST", path: "/saves" }, // Shortcut: create save
	{ method: "GET", path: "/lists" }, // Shortcut: fetch lists for a picker menu
];

// Called on token rotation so the old token stops working immediately
// instead of lingering for up to CACHE_TTL_MS.
export function evictCaptureKey(token: string) {
	captureKeyCache.delete(token);
}

export const resolveUser: MiddlewareHandler<AppBindings> = async (c, next) => {
	const captureKey = c.req.header("x-capture-key");
	if (captureKey) {
		const allowed = CAPTURE_TOKEN_ALLOWLIST.some(
			(entry) => entry.method === c.req.method && entry.path === c.req.path,
		);
		if (!allowed) {
			return c.json({ message: "Capture token not valid for this endpoint" }, HttpStatusCodes.FORBIDDEN);
		}

		const cached = captureKeyCache.get(captureKey);
		if (cached && cached.expiresAt > Date.now()) {
			c.set("userId", cached.userId);
			return next();
		}

		const [user] = await db
			.select({ id: usersTable.id })
			.from(usersTable)
			.where(eq(usersTable.captureToken, captureKey));

		if (!user) {
			return c.json({ message: "Invalid capture key" }, HttpStatusCodes.UNAUTHORIZED);
		}

		captureKeyCache.set(captureKey, { userId: user.id, expiresAt: Date.now() + CACHE_TTL_MS });
		c.set("userId", user.id);
		return next();
	}

	const authHeader = c.req.header("Authorization");
	if (!authHeader?.startsWith("Bearer ")) {
		return c.json({ message: "Missing or invalid Authorization header" }, HttpStatusCodes.UNAUTHORIZED);
	}

	const token = authHeader.slice(7);

	let clerkUserId: string;
	try {
		const payload = await verifyToken(token, { secretKey: env.CLERK_SECRET_KEY, clockSkewInMs: 5000 });
		clerkUserId = payload.sub;
	} catch (e) {
		c.var.logger.warn({ err: e }, "Token verification failed");
		return c.json({ message: "Invalid token" }, HttpStatusCodes.UNAUTHORIZED);
	}

	const cached = userCache.get(clerkUserId);
	if (cached && cached.expiresAt > Date.now()) {
		c.set("userId", cached.userId);
		return next();
	}

	const [user] = await db
		.select({ id: usersTable.id })
		.from(usersTable)
		.where(eq(usersTable.clerkUUID, clerkUserId));

	if (!user) {
		return c.json({ message: "User not found" }, HttpStatusCodes.UNAUTHORIZED);
	}

	userCache.set(clerkUserId, { userId: user.id, expiresAt: Date.now() + CACHE_TTL_MS });
	c.set("userId", user.id);
	await next();
};
