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
	DB_PASSWORD: z.string(),
	DB_USER: z.string(),
	DB_NAME: z.string(),
	DB_HOST: z.string(),
	DB_PORT: z.string(),
}).refine((input) => {
	if (input.NODE_ENV === "production") {
		return !!input.DB_NAME
	}
	return true
})

export type env = z.infer<typeof EnvSchema>

let env: env;
try {
	env = EnvSchema.parse(process.env)

} catch (e) {
	const error = e as ZodError;
	console.error("Invalid env")
	console.error(error.flatten().fieldErrors)
	process.exit(1)

}
export default env
