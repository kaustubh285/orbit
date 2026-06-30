import env from "@/env.js";
import { SarvamAIClient } from "sarvamai";

export const sarvamClient = new SarvamAIClient({
	apiSubscriptionKey: env.NOT_BULBUL
});

