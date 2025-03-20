import postgres from "postgres";
import { UserError } from "../errors.ts";
import { config } from "../config.ts";
import ora from "ora";
import { doesTableExist } from "./utils.ts";

export async function upsertTrees(sql: postgres.Sql, batchSize = 1000) {
	const { "temp-trees-table": tempTreesTable, "dry-run": dryRun } = config();
	const spinner = ora(`Starting upsert${dryRun ? " (dry-run)" : ""}`).start();

	try {
		const tableExists = await doesTableExist(sql, tempTreesTable);
		if (!tableExists) {
			spinner.fail(`Table ${tempTreesTable} does not exists`);
			throw new UserError(`Table ${tempTreesTable} does not exists`);
		}

		// Run stats query first
		const stats = await sql`
		WITH temp_stats AS (
			SELECT
					CASE
							WHEN trees.id IS NULL THEN 'insert'
							ELSE 'update'
					END as operation,
					COUNT(1) as count
			FROM ${sql(tempTreesTable)} temp
			LEFT JOIN trees ON trees.id = temp.gml_id
			GROUP BY
					CASE
							WHEN trees.id IS NULL THEN 'insert'
							ELSE 'update'
					END
		)
		SELECT * FROM temp_stats

		union all
		SELECT 'total' as operation, sum (count) as count from temp_stats
		;`;

		const insertCount = stats.find((s) => s.operation === "insert")?.count || 0;
		const updateCount = stats.find((s) => s.operation === "update")?.count || 0;
		const total = stats.find((s) => s.operation === "total")?.count || 0;

		spinner.info(`Would perform:
		- ${insertCount} inserts
		- ${updateCount} updates
		- ${total} total operations`);

		// Only execute if not dry-run
		if (!dryRun) {
			spinner.text = `This will upsert ${total} records`;
			let lastId = "";
			let processedCount = 0;
			let batchNumber = 0;

			while (true) {
				batchNumber++;
				const batch = await sql`
					SELECT * FROM ${sql(tempTreesTable)}
					WHERE gml_id > ${lastId}
					ORDER BY gml_id
					LIMIT ${batchSize}`;

				if (batch.length === 0) {
					spinner.info(
						`No more records to process. Total processed: ${processedCount}`,
					);
					break;
				}

				lastId = batch[batch.length - 1].gml_id;
				processedCount += batch.length;

				spinner.info(
					`Batch ${batchNumber}: Processing ${batch.length} records (${processedCount}/${total})`,
				);
				spinner.info(`  First ID: ${batch[0].gml_id}`);
				spinner.info(`  Last ID: ${lastId}`);

				const result = await sql`
					WITH inserted AS (
						INSERT INTO trees (
							id,
							lat,
							lng,
							standortnr,
							kennzeich,
							art_dtsch,
							art_bot,
							gattung_deutsch,
							gattung, strname,
							hausnr,
							pflanzjahr,
							standalter,
							stammumfg,
							baumhoehe,
							bezirk,
							eigentuemer,
							zusatz,
							kronedurch,
							"type",
							adopted,
							watered,
							radolan_sum,
							radolan_days,
							caretaker,
							geom)
						SELECT
							gml_id as id,
							ST_Y(ST_Transform(geom, 4326))::text as lat,
							ST_X(ST_Transform(geom, 4326))::text as lng,
							standortnr,
							kennzeich,
							art_dtsch,
							art_bot,
							gattung_deutsch,
							gattung,
							strname,
							hausnr,
							pflanzjahr,
							standalter,
							stammumfg,
							baumhoehe,
							bezirk,
							eigentuemer,
							zusatz,
							kronedurch,
							"type",
							NULL as adopted,
							NULL as watered,
							NULL as radolan_sum,
							NULL as radolan_days,
							NULL as caretaker,
							ST_Transform(ST_Force2D(geom), 4326) as geom
						FROM ${sql(tempTreesTable)} AS temp_trees
						WHERE gml_id > ${lastId}
						ON CONFLICT (id)
						DO UPDATE
						SET
							standortnr = excluded.standortnr,
							kennzeich = excluded.kennzeich,
							art_dtsch = excluded.art_dtsch,
							art_bot = excluded.art_bot,
							gattung_deutsch = excluded.gattung_deutsch,
							gattung = excluded.gattung,
							strname = excluded.strname,
							hausnr = excluded.hausnr,
							pflanzjahr = excluded.pflanzjahr,
							standalter = excluded.standalter,
							stammumfg = excluded.stammumfg,
							baumhoehe = excluded.baumhoehe,
							bezirk = excluded.bezirk,
							eigentuemer = excluded.eigentuemer,
							zusatz = excluded.zusatz,
							kronedurch = excluded.kronedurch,
							"type" = excluded."type",
							adopted = excluded.adopted,
							watered = excluded.watered,
							radolan_sum = excluded.radolan_sum,
							radolan_days = excluded.radolan_days,
							caretaker = excluded.caretaker,
							geom = excluded.geom
						RETURNING id
					)
					SELECT COUNT(*) as affected FROM inserted`;

				spinner.info(`  Affected rows in this batch: ${result[0].affected}`);
			}

			// Final verification
			const finalCount = await sql`SELECT COUNT(*) as count FROM trees`;
			spinner.info(`Final tree count in database: ${finalCount[0].count}`);

			spinner.succeed(`Upsert completed. Processed ${processedCount} records`);
		} else {
			spinner.succeed("Dry run complete");
		}
	} catch (error) {
		if (error instanceof UserError) {
			await sql.end();
			throw error;
		}
		console.error(error);
		await sql.end();
		process.exit(1);
	} finally {
		await sql.end();
		spinner.stop();
	}
}
