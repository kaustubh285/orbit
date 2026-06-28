import env from "@/env.js";
import { pinoLogger } from "hono-pino";
import { pino } from "pino";
import PinoPretty from "pino-pretty";

export function myPinoLogger() {
	return pinoLogger({
		pino: pino(
			{
				level: env.LOG_LEVEL || "info",
			},
			env.NODE_ENV === "production"
				? undefined
				: PinoPretty({ colorize: true, ignore: "pid,hostname,reqId" }),
		),
		http: {
			reqId: () => crypto.randomUUID(),
			onReqBindings: (c) => ({
				method: c.req.method,
				path: c.req.path,
			}),
			onResBindings: (c) => ({
				status: c.res.status,
			}),
		},
	});
}
