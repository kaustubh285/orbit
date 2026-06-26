import { useOrbitAppStore } from "@/store/orbit-app.store"
import { Box, Text, type TextProps } from "@mantine/core"
import type React from "react"
import { useState } from "react"

interface PrivacyAwareTextProps extends Omit<TextProps, "style"> {
	children: any
	revealOnHover?: boolean
	component?: React.ElementType
	href?: string
	target?: string
	rel?: string
	justify?: string
	style?: React.CSSProperties
	onClick?: () => void
}

const isTouchDevice = () => window.matchMedia("(hover: none)").matches

export function PrivacyAwareText({ children, revealOnHover = true, style, ...props }: PrivacyAwareTextProps) {
	const { privacyMode } = useOrbitAppStore()
	const [revealed, setRevealed] = useState(false)

	const blurred = privacyMode && !revealed
	const touchDevice = isTouchDevice()

	const privacyStyle: React.CSSProperties = {
		...style,
		filter: blurred ? "blur(5px)" : undefined,
		transition: "filter 0.2s ease",
		userSelect: blurred ? "none" : undefined,
		cursor: privacyMode && revealOnHover ? "pointer" : undefined,
	}

	const handlers = {
		onMouseEnter: revealOnHover && privacyMode && !touchDevice ? () => setRevealed(true) : undefined,
		onMouseLeave: revealOnHover && privacyMode && !touchDevice ? () => setRevealed(false) : undefined,
		onClick: revealOnHover && privacyMode && touchDevice ? () => setRevealed((r) => !r) : undefined,
	}

	if (props.href || props.justify) {
		return (
			<Box {...props as any} {...handlers} style={privacyStyle}>
				{children}
			</Box>
		)
	}

	return (
		<Text {...props as any} {...handlers} style={privacyStyle} onClick={props.onClick}>
			{children}
		</Text>
	)
}
