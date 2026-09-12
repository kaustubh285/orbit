import { sarvamClient } from "@/lib/sarvam-ai.js";
import { logAiCall } from "@/lib/log-ai-call.js";

export async function transcribeVoice(file: File, userId?: string): Promise<string> {
	const start = Date.now();

	try {
		const response = await sarvamClient.speechToText.transcribe({
			file,
			model: "saaras:v3",
			mode: "transcribe",
			// language_code omitted — auto-detect supports multilingual input
		});

		logAiCall({
			userId,
			model: "saaras:v3",
			feature: "voice_transcribe",
			latencyMs: Date.now() - start,
			success: true,
		});

		console.log(response)

		return response.transcript;
	} catch (err) {
		logAiCall({
			userId,
			model: "saaras:v3",
			feature: "voice_transcribe",
			latencyMs: Date.now() - start,
			success: false,
			errorCode: err instanceof Error ? err.message.slice(0, 100) : "unknown",
		});
		throw err;
	}
}
