import { useEffect, useState } from 'react'
import { ActionIcon, Loader, Tooltip } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { IconMicrophone, IconPlayerStopFilled } from '@tabler/icons-react'
import { useVoiceRecorder } from './use-voice-recorder.hook'
import { VoiceQuestModal } from './voice-quest-modal.component'

const PULSE_STYLE: React.CSSProperties = {
	animation: 'voice-fab-pulse 1s ease-in-out infinite',
}

export function VoiceFAB() {
	const { status, result, error, startRecording, stopRecording, reset } = useVoiceRecorder()
	const [modalOpen, setModalOpen] = useState(false)
	const isDesktop = useMediaQuery('(min-width: 48em)', false, { getInitialValueInEffect: false })

	const isRecording = status === 'recording'
	const isLoading = status === 'loading'

	useEffect(() => {
		if (status === 'done') setModalOpen(true)
	}, [status])

	useEffect(() => {
		if (status !== 'error') return
		const t = setTimeout(reset, 2000)
		return () => clearTimeout(t)
	}, [status, reset])

	function handleClick() {
		if (isRecording) {
			stopRecording()
		} else if (status === 'idle' || status === 'error') {
			startRecording()
		}
	}

	function handleClose() {
		setModalOpen(false)
		reset()
	}

	const bottom = isDesktop
		? '24px'
		: 'calc(64px + env(safe-area-inset-bottom) + 16px)'

	const tooltipLabel = error ?? (isRecording ? 'Tap to stop' : 'Tap to record')

	return (
		<>
			<style>{`
				@keyframes voice-fab-pulse {
					0%, 100% { box-shadow: 0 0 0 0 rgba(250, 82, 82, 0.5); }
					50% { box-shadow: 0 0 0 8px rgba(250, 82, 82, 0); }
				}
			`}</style>

			<Tooltip label={tooltipLabel} position="left" withArrow>
				<ActionIcon
					variant="filled"
					color={isRecording ? 'red' : 'dark'}
					radius="md"
					size="lg"
					onClick={handleClick}
					disabled={isLoading}
					style={{
						position: 'fixed',
						bottom,
						right: '16px',
						zIndex: 200,
						...(isRecording ? PULSE_STYLE : {}),
					}}
				>
					{isLoading
						? <Loader size={14} color="white" />
						: isRecording
							? <IconPlayerStopFilled size={16} />
							: <IconMicrophone size={18} />}
				</ActionIcon>
			</Tooltip>

			<VoiceQuestModal
				opened={modalOpen}
				result={result}
				onClose={handleClose}
			/>
		</>
	)
}
