import { createClerkClient } from "@clerk/backend";
import { eq } from "drizzle-orm";
import * as HttpStatusCodes from "stoker/http-status-codes";
import type { MiddlewareHandler } from "hono";
import { db } from "@/db/db.js";
import { usersTable } from "@/db/schemas/users.schema.js";
import type { AppBindings } from "@/lib/types.js";
import env from "@/env.js";

const clerk = createClerkClient({ secretKey: env.CLERK_SECRET_KEY });

export const resolveUser: MiddlewareHandler<AppBindings> = async (c, next) => {
	const authHeader = c.req.header("Authorization");
	if (!authHeader?.startsWith("Bearer ")) {
		return c.json({ message: "Missing or invalid Authorization header" }, HttpStatusCodes.UNAUTHORIZED);
	}

	const token = authHeader.slice(7);

	let clerkUserId: string;
	try {
		const verified = await clerk.verifyToken(token);
		clerkUserId = verified.sub;
	} catch {
		return c.json({ message: "Invalid token" }, HttpStatusCodes.UNAUTHORIZED);
	}

	const [user] = await db
		.select({ id: usersTable.id })
		.from(usersTable)
		.where(eq(usersTable.clerkUUID, clerkUserId));

	if (!user) {
		return c.json({ message: "User not found" }, HttpStatusCodes.UNAUTHORIZED);
	}

	c.set("userId", user.id);
	await next();
};
