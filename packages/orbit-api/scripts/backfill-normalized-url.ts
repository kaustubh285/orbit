/**
 * Backfill/repair normalizedUrl for all saves. Idempotent; safe to run whether
 * or not the saves_user_normalized_url_uniq index exists yet.
 *
 * Phase 1 — recompute: every save whose stored normalizedUrl differs from
 * normalizeUrl(sourceUrl) (including NULLs, and values computed by older
 * versions of the normalizer) is updated, oldest-first. If the update collides
 * with the unique index, the two rows are duplicates: with --dedupe the newer
 * one is soft-deleted, without it the row is logged and skipped.
 *
 * Phase 2 — sweep: finds non-deleted (userId, normalizedUrl) groups with >1 row
 * (possible while the unique index is not yet in place). --dedupe soft-deletes
 * all but the oldest in each group.
 *
 * Run with --dedupe until it reports clean, then run db:migrate.
 */
import { and, asc, eq, isNull, ne } from "drizzle-orm";
import { db } from "../src/db/db.js";
import { savesTable } from "../src/db/schemas/saves.schema.js";
import { normalizeUrl } from "../src/lib/normalize-url.js";

const dedupe = process.argv.includes("--dedupe");

function isUniqueViolation(err: unknown): boolean {
	for (let e = err; e instanceof Error; e = e.cause) {
		if ((e as { code?: string }).code === "23505") return true;
	}
	return false;
}

async function softDelete(id: string, extra: Partial<{ normalizedUrl: string }> = {}) {
	await db
		.update(savesTable)
		.set({ deletedAt: new Date(), ...extra })
		.where(eq(savesTable.id, id));
}

// ---- Phase 1: recompute normalizedUrl against the current normalizer ----

const saves = await db
	.select({
		id: savesTable.id,
		sourceUrl: savesTable.sourceUrl,
		normalizedUrl: savesTable.normalizedUrl,
		userId: savesTable.userId,
		createdAt: savesTable.createdAt,
	})
	.from(savesTable)
	.orderBy(asc(savesTable.createdAt));

const stale = saves.filter((s) => s.normalizedUrl !== normalizeUrl(s.sourceUrl));
console.log(`[recompute] ${saves.length} saves total, ${stale.length} need (re)normalizing${dedupe ? " (dedupe ON)" : ""}`);

let updated = 0;
let softDeleted = 0;
let skipped = 0;

for (const save of stale) {
	const expected = normalizeUrl(save.sourceUrl);
	try {
		await db
			.update(savesTable)
			.set({ normalizedUrl: expected })
			.where(eq(savesTable.id, save.id));
		updated++;
	} catch (err) {
		if (!isUniqueViolation(err)) throw err;

		if (!dedupe) {
			console.log(`[recompute] DUPE (skipped): id=${save.id} url=${save.sourceUrl} -> ${expected}`);
			skipped++;
			continue;
		}

		const [conflict] = await db
			.select({ id: savesTable.id, createdAt: savesTable.createdAt })
			.from(savesTable)
			.where(and(
				eq(savesTable.userId, save.userId),
				eq(savesTable.normalizedUrl, expected),
				isNull(savesTable.deletedAt),
				ne(savesTable.id, save.id),
			))
			.limit(1);
		if (!conflict) throw err;

		if (conflict.createdAt <= save.createdAt) {
			// existing row is older — keep it, soft-delete this one
			// (soft-deleting exits the partial index, so setting normalizedUrl is safe)
			await softDelete(save.id, { normalizedUrl: expected });
			console.log(`[dedupe] soft-deleted ${save.id} (newer copy of ${conflict.id}) url=${save.sourceUrl}`);
		} else {
			await softDelete(conflict.id);
			await db.update(savesTable).set({ normalizedUrl: expected }).where(eq(savesTable.id, save.id));
			updated++;
			console.log(`[dedupe] soft-deleted ${conflict.id} (newer copy of ${save.id}) url=${save.sourceUrl}`);
		}
		softDeleted++;
	}
}

console.log(`[recompute] done — updated=${updated} softDeleted=${softDeleted} skipped=${skipped}`);

// ---- Phase 2: sweep identical-value dupe groups (pre-index state) ----

const live = await db
	.select({
		id: savesTable.id,
		userId: savesTable.userId,
		normalizedUrl: savesTable.normalizedUrl,
		createdAt: savesTable.createdAt,
		sourceUrl: savesTable.sourceUrl,
	})
	.from(savesTable)
	.where(isNull(savesTable.deletedAt));

const groups = new Map<string, typeof live>();
for (const save of live) {
	if (!save.normalizedUrl) continue;
	const key = `${save.userId}::${save.normalizedUrl}`;
	groups.set(key, [...(groups.get(key) ?? []), save]);
}

const dupeGroups = [...groups.values()].filter((g) => g.length > 1);
if (dupeGroups.length === 0) {
	console.log("[sweep] clean — no duplicate groups remain, safe to run db:migrate");
} else {
	console.log(`[sweep] ${dupeGroups.length} duplicate group(s):`);
	let swept = 0;
	for (const group of dupeGroups) {
		const sorted = [...group].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
		const [keep, ...extras] = sorted;
		console.log(`  ${keep.normalizedUrl} — keeping ${keep.id} (${keep.createdAt.toISOString()})`);
		for (const extra of extras) {
			if (dedupe) {
				await softDelete(extra.id);
				swept++;
				console.log(`    soft-deleted ${extra.id} (${extra.createdAt.toISOString()})`);
			} else {
				console.log(`    would soft-delete ${extra.id} (${extra.createdAt.toISOString()}) — re-run with --dedupe`);
			}
		}
	}
	if (dedupe) console.log(`[sweep] soft-deleted ${swept} duplicate save(s) — safe to run db:migrate`);
}

process.exit(0);
