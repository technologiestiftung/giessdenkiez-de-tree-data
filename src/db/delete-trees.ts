import postgres from "postgres";
import { config } from "../config.js";
import { doesTableExist } from "./utils.js";
import { UserError } from "../errors.js";
import ora from "ora";
import { delay } from "../utils.js";

export async function deleteTrees(sql: postgres.Sql, batchSize = 100) {
	try {
		const { "temp-trees-table": tempTreesTable, "dry-run": dryRun } = config();
		const tableExists = await doesTableExist(sql, tempTreesTable);
		if (!tableExists) {
			throw new UserError(`Table ${tempTreesTable} does not exists`);
		}
		const spinner = ora("Starting cleanup of trees_watered data").start();
		await delay(1000);

		const resultTreesWatered = await sql<{ tree_id: string; count: string }[]>`
		SELECT tree_id, count(1) FROM trees_watered
		WHERE tree_id IN (
			SELECT id FROM trees
			WHERE gml_id IN (
				SELECT trees.gml_id FROM trees
				LEFT JOIN ${sql(tempTreesTable)} ON trees.gml_id = ${sql(tempTreesTable)}.gml_id
				WHERE ${sql(tempTreesTable)}.gml_id IS NULL
			)
		) GROUP  by tree_id;`;
		spinner.text = `This will remove ${resultTreesWatered.length} records from table trees_watered`;
		await delay(1000);

		if (!dryRun) {
			await sql`DELETE FROM trees_watered WHERE tree_id IN ${sql(resultTreesWatered.map((r) => r.tree_id))}`;
		}
		spinner.succeed(
			`Removed ${resultTreesWatered.length} records from table trees_watered`,
		);

		spinner.text = "Starting cleanup of trees_adopted data";

		const resultTreesAdopted = await sql<{ tree_id: string; count: string }[]>`
		SELECT tree_id, count(1) FROM trees_adopted
WHERE tree_id IN (
	SELECT id FROM trees
	WHERE gml_id IN (
		SELECT trees.gml_id FROM trees
		LEFT JOIN ${sql(tempTreesTable)} ON trees.gml_id = ${sql(tempTreesTable)}.gml_id
		WHERE ${sql(tempTreesTable)}.gml_id IS NULL
	)
) GROUP  by tree_id;`;

		spinner.text = `This will remove ${resultTreesAdopted.length} records from table trees_adopted`;
		await delay(1000);

		if (!dryRun) {
			await sql`DELETE FROM trees_adopted WHERE tree_id IN ${sql(
				resultTreesAdopted.map((r) => r.tree_id),
			)}`;
		}
		spinner.succeed(
			`Removed ${resultTreesAdopted.length} records from table trees_adopted`,
		);

		spinner.text = "Starting cleanup of trees data";
		await delay(1000);

		const resultTrees = await sql<{ id: string }[]>`
		SELECT id FROM trees
WHERE gml_id IN (
	SELECT trees.gml_id FROM trees
	LEFT JOIN ${sql(tempTreesTable)} ON trees.gml_id = ${sql(tempTreesTable)}.gml_id
	WHERE ${sql(tempTreesTable)}.gml_id IS NULL
);`;
		spinner.text = `This will remove ${resultTrees.length} records from table trees`;
		await delay(1000);

		if (!dryRun) {
			const limit = batchSize; // adjust this value based on your needs
			spinner.start(`Removing ${resultTrees.length} records from table trees`);
			for (let i = 0; i < resultTrees.length; i += limit) {
				const batch = resultTrees.slice(i, i + limit);
				spinner.text = `Removing batch ${i + 1}-${i + 1 + limit}/${resultTrees.length} records from table trees`;
				await sql`DELETE FROM trees WHERE id IN ${sql(batch.map((r) => r.id))}`;
			}
		}
		spinner.succeed(`Removed ${resultTrees.length} records from table trees`);
		spinner.succeed("Cleanup of trees data completed");
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
