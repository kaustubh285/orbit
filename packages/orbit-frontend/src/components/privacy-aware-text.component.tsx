import { useOrbitAppStore } from "@/store/orbit-app.store"
import { Text, type TextProps } from "@mantine/core"
import { useState } from "react"

interface PrivacyAwareTextProps extends TextProps {
	children: string
	revealOnHover?: boolean
}

const isTouchDevice = () => window.matchMedia("(hover: none)").matches

export function PrivacyAwareText({ children, revealOnHover = true, style, ...props }: PrivacyAwareTextProps) {
	const { privacyMode } = useOrbitAppStore()
	const [revealed, setRevealed] = useState(false)

	const blurred = privacyMode && !revealed
	const touchDevice = isTouchDevice()

	return (
		<Text
			{...props}
			onMouseEnter={revealOnHover && privacyMode && !touchDevice ? () => setRevealed(true) : undefined}
			onMouseLeave={revealOnHover && privacyMode && !touchDevice ? () => setRevealed(false) : undefined}
			onClick={revealOnHover && privacyMode && touchDevice ? () => setRevealed((r) => !r) : undefined}
			style={{
				...style,
				filter: blurred ? "blur(5px)" : undefined,
				transition: "filter 0.2s ease",
				userSelect: blurred ? "none" : undefined,
				cursor: privacyMode && revealOnHover ? "pointer" : undefined,
			}}
		>
			{children}
		</Text>
	)
}
