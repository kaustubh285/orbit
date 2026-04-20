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
		password: process.env.DB_PASSWORD || "",
		user: process.env.DB_USER || "",
		database: process.env.DB_NAME || "",
		host: process.env.DB_HOST || "localhost",
		port: parseInt(process.env.DB_PORT || "5432", 10),
		ssl: false,
	},
});
