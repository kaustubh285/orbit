import env from '@/env.js';

import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema.js";

export const db = drizzle({
	schema,
	connection: {
		password: env.DB_PASSWORD || "",
		user: env.DB_USER || "",
		database: env.DB_NAME || "",
		host: env.DB_HOST || "localhost",
		port: parseInt(env.DB_PORT || "5432", 10),
	},
});
