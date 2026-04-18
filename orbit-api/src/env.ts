import { z } from "zod"
import { config } from "dotenv"
import { expand } from "dotenv-expand"


expand(config())

const EnvSchema = z.object({
	LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]),
	PORT: z.coerce.number().default(3000),
	NODE_ENV: z.string().default("development")
})

export type env = z.infer<typeof EnvSchema>
let env: env

try {

	env = EnvSchema.parse(process.env)
}
catch (err) {
	console.error("Error parsing environment variables:", err)
	process.exit(1)
}
export default env
