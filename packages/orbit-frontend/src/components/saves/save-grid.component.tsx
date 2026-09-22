import type { Save } from "@/types"
import { Box, Stack, Text } from "@mantine/core"
import { PrivacyAwareText } from "../privacy-aware-text.component"
import {
	IconBrandInstagram,
	IconBrandReddit,
	IconBrandYoutube,
	IconWorld,
} from "@tabler/icons-react"
import { useState } from "react"
import { getThumbnailUrl } from "@/lib/thumbnail"

const PLATFORM_META: Record<Save["sourcePlatform"], { color: string; Icon: React.ElementType }> = {
	youtube: { color: "var(--mantine-color-red-9)", Icon: IconBrandYoutube },
	reddit: { color: "var(--mantine-color-orange-9)", Icon: IconBrandReddit },
	instagram: { color: "var(--mantine-color-grape-9)", Icon: IconBrandInstagram },
	web: { color: "var(--mantine-color-cyan-9)", Icon: IconWorld },
}

const CARD_STYLE = {
	borderRadius: "15px",
	boxShadow: "0px 0px 12px rgba(255, 255, 255, 0.15)",
} as const

function SaveImage({ save, meta }: { save: Save; meta: (typeof PLATFORM_META)[Save["sourcePlatform"]] }) {
	const [loaded, setLoaded] = useState(false)
	const PlatformIcon = meta.Icon

	return (
		<Box
			style={{
				position: "relative",
				width: "100%",
				// Reserve space while loading so the lazy image has a layout box
				aspectRatio: loaded ? undefined : "16 / 9",
			}}
		>
			<img
				loading="lazy"
				src={getThumbnailUrl(save.thumbnailUrl)!}
				alt=""
				onLoad={() => setLoaded(true)}
				style={{
					display: "block",
					width: "100%",
					height: "auto",
					objectFit: "cover",
					opacity: loaded ? 1 : 0,
					...CARD_STYLE,
				}}
			/>
			{!loaded && (
				<Box
					style={{
						position: "absolute",
						inset: 0,
						background: meta.color,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						...CARD_STYLE,
					}}
				>
					<PlatformIcon size={28} color="rgba(255,255,255,0.4)" />
				</Box>
			)}
		</Box>
	)
}

export default function SaveGrid({
	saves,
	isLoading,
	onRefetch,
	onClick,
}: {
	saves: Save[]
	isLoading: boolean
	onRefetch?: () => void
	onClick?: (save: Save) => void
}) {
	return (
		<Box className="masonry">
			{saves.map((save) => {
				const meta = PLATFORM_META[save.sourcePlatform]
				const PlatformIcon = meta.Icon
				return (
					<Stack key={save.id} className="masonry-item" gap="xs" onClick={() => onClick && onClick(save)}>
						{save.thumbnailUrl ? (
							<SaveImage save={save} meta={meta} />
						) : (
							<Box
								style={{
									width: "100%",
									aspectRatio: "1 / 1",
									background: meta.color,
									display: "flex",
									flexDirection: "column",
									alignItems: "center",
									justifyContent: "center",
									gap: 8,
									padding: 12,
									...CARD_STYLE,
								}}
							>
								<PlatformIcon size={28} color="rgba(255,255,255,0.6)" />
								<Text
									size="xs"
									fw={600}
									lineClamp={3}
									ta="center"
									style={{ color: "rgba(255,255,255,0.85)", lineHeight: 1.3 }}
								>
									{save.aiTitle ?? save.title ?? save.sourceUrl}
								</Text>
							</Box>
						)}

						<Text
							size="xs"
							fw={600}
							lineClamp={2}
							style={{ color: "#fff", lineHeight: 1.3 }}
						>
							{save.aiTitle ?? save.title ?? save.sourceUrl}
						</Text>

					</Stack>
				)
			})}
		</Box>
	)
}
