import type { Save } from "@/types"
import { ActionIcon, Box, Flex, Group, Stack, Text } from "@mantine/core"
import { PrivacyAwareText } from "../privacy-aware-text.component"
import { IconDots } from "@tabler/icons-react"
import { useMediaQuery } from "@mantine/hooks"

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
			{saves.map((save) => (
				<Stack key={save.id} className="masonry-item" gap="xs" onClick={() => onClick && onClick(save)}>
					{save.thumbnailUrl && (
						<img
							src={save.thumbnailUrl}
							alt=""
							style={{
								display: "block",
								width: "100%",
								height: "auto",
								objectFit: "cover",
								borderRadius: "15px",
								boxShadow: "0px 0px 12px rgba(255, 255, 255, 0.15)"
							}}
						/>
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
			))}
		</Box>
	)
}
