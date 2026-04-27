import { config } from "dotenv";
import { expand } from "dotenv-expand";
import { defineConfig } from "drizzle-kit";

expand(config());

export default defineConfig({
	out: "./src/db/migrations",
	schema: "./src/db/schema.ts",
	strict: true,
	verbose: true,
	dialect: "postgresql",
	dbCredentials: {
		url: process.env.DATABASE_URL,
		ssl: process.env.NODE_ENV === "production",
	},
});
