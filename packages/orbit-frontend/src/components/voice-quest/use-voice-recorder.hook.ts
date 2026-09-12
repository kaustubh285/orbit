import { useCallback, useRef, useState } from 'react'
import { useAuth } from '@clerk/react'
import type { PostQuestsVoiceResponse } from '@orbit/client'

export type VoiceRecorderStatus = 'idle' | 'recording' | 'loading' | 'done' | 'error'

const MIN_RECORDING_MS = 500

function mimeToExt(mimeType: string): string {
	if (mimeType.includes('mp4')) return 'm4a'
	if (mimeType.includes('ogg')) return 'ogg'
	if (mimeType.includes('wav')) return 'wav'
	return 'webm'
}

export function useVoiceRecorder() {
	const { getToken } = useAuth()
	const [status, setStatus] = useState<VoiceRecorderStatus>('idle')
	const [result, setResult] = useState<PostQuestsVoiceResponse | null>(null)
	const [error, setError] = useState<string | null>(null)

	const recorderRef = useRef<MediaRecorder | null>(null)
	const chunksRef = useRef<Blob[]>([])
	const startedAtRef = useRef<number>(0)
	const cancelledRef = useRef(false)

	const upload = useCallback(async (blob: Blob) => {
		try {
			const token = await getToken()
			const ext = mimeToExt(blob.type)
			const formData = new FormData()
			formData.append('audio', blob, `recording.${ext}`)

			const res = await fetch(
				`${import.meta.env.VITE_API_URL ?? 'http://localhost:9999'}/quests/voice`,
				{
					method: 'POST',
					headers: {
						Authorization: `Bearer ${token}`,
						'X-Timezone': Intl.DateTimeFormat().resolvedOptions().timeZone,
					},
					body: formData,
				},
			)

			if (!res.ok) throw new Error(`${res.status}`)
			const data: PostQuestsVoiceResponse = await res.json()
			setResult(data)
			setStatus('done')
		} catch {
			setError('Failed to process voice note. Please try again.')
			setStatus('error')
		}
	}, [getToken])

	const startRecording = useCallback(async () => {
		setError(null)
		setResult(null)
		cancelledRef.current = false
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
			chunksRef.current = []

			const recorder = new MediaRecorder(stream)
			recorder.ondataavailable = (e) => {
				if (e.data.size > 0) chunksRef.current.push(e.data)
			}
			recorder.onstop = () => {
				stream.getTracks().forEach((t) => t.stop())
				if (cancelledRef.current) return
				const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
				upload(blob)
			}

			recorder.start()
			recorderRef.current = recorder
			startedAtRef.current = Date.now()
			setStatus('recording')
		} catch {
			setError('Microphone access denied.')
			setStatus('error')
		}
	}, [upload])

	// Called on pointer up — uploads if held long enough, otherwise resets
	const stopRecording = useCallback(() => {
		const recorder = recorderRef.current
		if (!recorder || recorder.state !== 'recording') return

		const elapsed = Date.now() - startedAtRef.current
		if (elapsed < MIN_RECORDING_MS) {
			cancelledRef.current = true
			recorder.stop()
			setError('Recording too short — try again')
			setStatus('error')
			return
		}

		setStatus('loading')
		recorder.stop()
	}, [])

	// Called on pointer cancel — silently aborts without uploading
	const cancelRecording = useCallback(() => {
		const recorder = recorderRef.current
		if (!recorder || recorder.state !== 'recording') return
		cancelledRef.current = true
		recorder.stop()
		setStatus('idle')
	}, [])

	const reset = useCallback(() => {
		setStatus('idle')
		setResult(null)
		setError(null)
	}, [])

	return { status, result, error, startRecording, stopRecording, reset }
}
