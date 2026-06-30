import { eq } from "drizzle-orm";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { db } from "../../db/db.js";
import { usersTable } from "../../db/schemas/users.schema.js";
import type { AppRouteHandler } from "@/lib/types.js";
import type { GetMeRoute, UpdateMeRoute } from "./routes.js";

export const getMe: AppRouteHandler<GetMeRoute> = async (c) => {
	const userId = c.var.userId;

	const [user] = await db
		.select({
			id: usersTable.id,
			name: usersTable.name,
			displayName: usersTable.displayName,
			email: usersTable.email,
			avatar: usersTable.avatar,
			aiModel: usersTable.aiModel,
		})
		.from(usersTable)
		.where(eq(usersTable.id, userId));

	if (!user) {
		return c.json({ message: "User not found" }, HttpStatusCodes.NOT_FOUND);
	}

	return c.json(user, HttpStatusCodes.OK);
};

export const updateMe: AppRouteHandler<UpdateMeRoute> = async (c) => {
	const userId = c.var.userId;
	const body = c.req.valid("json");

	const [updated] = await db
		.update(usersTable)
		.set(body)
		.where(eq(usersTable.id, userId))
		.returning({
			id: usersTable.id,
			name: usersTable.name,
			displayName: usersTable.displayName,
			email: usersTable.email,
			avatar: usersTable.avatar,
			aiModel: usersTable.aiModel,
		});

	if (!updated) {
		return c.json({ message: "User not found" }, HttpStatusCodes.NOT_FOUND);
	}

	return c.json(updated, HttpStatusCodes.OK);
};
