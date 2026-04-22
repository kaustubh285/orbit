import { eq } from "drizzle-orm";
import * as HttpStatusCodes from "stoker/http-status-codes";
import type { MiddlewareHandler } from "hono";
import { db } from "@/db/db.js";
import { usersTable } from "@/db/schemas/users.schema.js";
import type { AppBindings } from "@/lib/types.js";

export const resolveUser: MiddlewareHandler<AppBindings> = async (c, next) => {
	const clerkId = c.req.header("x-user-id");
	if (!clerkId) {
		return c.json({ message: "Missing x-user-id header" }, HttpStatusCodes.UNAUTHORIZED);
	}

	const [user] = await db
		.select({ id: usersTable.id })
		.from(usersTable)
		.where(eq(usersTable.clerkUUID, clerkId));

	if (!user) {
		return c.json({ message: "User not found" }, HttpStatusCodes.UNAUTHORIZED);
	}

	c.set("userId", user.id);
	await next();
};
