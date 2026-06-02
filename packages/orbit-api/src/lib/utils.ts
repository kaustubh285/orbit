export function toDate(val: string | null | undefined): Date | null | undefined {
	if (val === undefined) return undefined;
	if (val === null) return null;
	return new Date(val);
}
