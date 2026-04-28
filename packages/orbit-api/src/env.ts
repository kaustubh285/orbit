import { z } from 'zod';
import { config } from "dotenv";
import { expand } from "dotenv-expand";
import type { ZodError } from 'zod';

expand(config());

const EnvSchema = z.object({
	NODE_ENV: z.string().default("development"),
	PORT: z.coerce.number().default(9999),
	LOG_LEVEL: z.enum(["fatal", "debug", "info", "warn", "error"]),
	VERSION: z.string(),
	DATABASE_URL: z.string().url(),
	FRONTEND_URL: z.string().default("*"),
	CLERK_SECRET_KEY: z.string(),
	ANTHROPIC_API_KEY: z.string().optional(),
});

export type Env = z.infer<typeof EnvSchema>;

let env: Env;
try {
	env = EnvSchema.parse(process.env);
} catch (e) {
	const error = e as ZodError;
	console.error("Invalid env");
	console.error(error.flatten().fieldErrors);
	process.exit(1);
}

export default env;
