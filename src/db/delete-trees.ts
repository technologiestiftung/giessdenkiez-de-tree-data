import postgres from "postgres";
import { config } from "../config.ts";
import { doesTableExist } from "./utils.ts";
import { UserError } from "../errors.ts";
import ora from "ora";
import { delay } from "../utils.ts";

export async function deleteTrees(sql: postgres.Sql, batchSize = 100) {
	try {
		const { "temp-trees-table": tempTreesTable, "dry-run": dryRun } = config();

		const tableExists = await doesTableExist(sql, tempTreesTable);
		if (!tableExists) {
			throw new UserError(`Table ${tempTreesTable} does not exists`);
		}
		const spinner = ora(
			`${dryRun ? "[DRY RUN] " : ""}Starting cleanup of trees_watered data`,
		).start();
		await delay(1000);

		const resultTreesWatered = await sql<{ tree_id: string; count: string }[]>`
		SELECT tree_id, count(1) FROM trees_watered
		WHERE tree_id IN (
			SELECT id FROM trees
			WHERE id IN (
				SELECT trees.id FROM trees
				LEFT JOIN ${sql(tempTreesTable)} ON trees.id = ${sql(tempTreesTable)}.gml_id
				WHERE ${sql(tempTreesTable)}.gml_id IS NULL
			)
		) GROUP  by tree_id;`;
		spinner.text = `${dryRun ? "[DRY RUN] " : ""}This ${dryRun ? "would" : "will"} remove ${resultTreesWatered.length} records from table trees_watered`;
		await delay(1000);

		if (!dryRun) {
			await sql`DELETE FROM trees_watered WHERE tree_id IN ${sql(resultTreesWatered.map((r) => r.tree_id))}`;
		}
		spinner.succeed(
			`${dryRun ? "[DRY RUN] " : ""}${dryRun ? "Would remove" : "Removed"} ${resultTreesWatered.length} records from table trees_watered`,
		);

		spinner.text = `${dryRun ? "[DRY RUN] " : ""}Starting cleanup of trees_adopted data`;

		const resultTreesAdopted = await sql<{ tree_id: string; count: string }[]>`
		SELECT tree_id, count(1) FROM trees_adopted
WHERE tree_id IN (
	SELECT id FROM trees
	WHERE id IN (
		SELECT trees.id FROM trees
		LEFT JOIN ${sql(tempTreesTable)} ON trees.id = ${sql(tempTreesTable)}.gml_id
		WHERE ${sql(tempTreesTable)}.gml_id IS NULL
	)
) GROUP  by tree_id;`;

		spinner.text = `${dryRun ? "[DRY RUN] " : ""}This ${dryRun ? "would" : "will"} remove ${resultTreesAdopted.length} records from table trees_adopted`;
		await delay(1000);

		if (!dryRun) {
			await sql`DELETE FROM trees_adopted WHERE tree_id IN ${sql(
				resultTreesAdopted.map((r) => r.tree_id),
			)}`;
		}
		spinner.succeed(
			`${dryRun ? "[DRY RUN] " : ""}${dryRun ? "Would remove" : "Removed"} ${resultTreesAdopted.length} records from table trees_adopted`,
		);

		spinner.text = `${dryRun ? "[DRY RUN] " : ""}Starting cleanup of trees data`;
		await delay(1000);

		const resultTrees = await sql<{ id: string }[]>`
		SELECT id FROM trees
WHERE id IN (
	SELECT trees.id FROM trees
	LEFT JOIN ${sql(tempTreesTable)} ON trees.id = ${sql(tempTreesTable)}.gml_id
	WHERE ${sql(tempTreesTable)}.gml_id IS NULL
);`;
		spinner.text = `${dryRun ? "[DRY RUN] " : ""}This ${dryRun ? "would" : "will"} remove ${resultTrees.length} records from table trees`;
		await delay(1000);

		if (!dryRun) {
			const limit = batchSize;
			spinner.start(`Removing ${resultTrees.length} records from table trees`);
			for (let i = 0; i < resultTrees.length; i += limit) {
				const batch = resultTrees.slice(i, i + limit);
				spinner.text = `Removing batch ${i + 1}-${i + 1 + limit}/${resultTrees.length} records from table trees`;
				await sql`DELETE FROM trees WHERE id IN ${sql(batch.map((r) => r.id))}`;
			}
		}
		spinner.succeed(
			`${dryRun ? "[DRY RUN] " : ""}${dryRun ? "Would remove" : "Removed"} ${resultTrees.length} records from table trees`,
		);
		spinner.succeed(
			`${dryRun ? "[DRY RUN] " : ""}${dryRun ? "Would complete" : "Completed"} cleanup of trees data`,
		);
	} catch (error: unknown) {
		if (error instanceof UserError) {
			await sql.end();
			throw error;
		}
		console.error(error);
		await sql.end();
		process.exit(1);
	}
}
