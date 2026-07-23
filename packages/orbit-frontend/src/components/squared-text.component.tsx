import { Group } from "@mantine/core"

export const SquaredText = ({ children }: { children: React.ReactNode }) => {
	return (
		<Group gap={2}>{"["}
			{children}
			{']'}
		</Group>
	)
}
