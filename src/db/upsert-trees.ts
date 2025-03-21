import postgres from "postgres";
import { UserError } from "../errors.ts";
import { config } from "../config.ts";
import ora from "ora";
import { doesTableExist } from "./utils.ts";

export async function upsertTrees(sql: postgres.Sql, batchSize = 500) {
	const { "temp-trees-table": tempTreesTable, "dry-run": dryRun } = config();
	const spinner = ora(`Starting upsert${dryRun ? " (dry-run)" : ""}`).start();

	try {
		const tableExists = await doesTableExist(sql, tempTreesTable);
		if (!tableExists) {
			spinner.fail(`Table ${tempTreesTable} does not exists`);
			throw new UserError(`Table ${tempTreesTable} does not exists`);
		}

		// Check if processed column exists, if not add it
		const hasProcessedColumn = await sql`
			SELECT column_name
			FROM information_schema.columns
			WHERE table_name = ${tempTreesTable}
			AND column_name = 'processed'`;

		if (hasProcessedColumn.length === 0) {
			spinner.text = "Adding processed column...";
			await sql`ALTER TABLE ${sql(tempTreesTable)} ADD COLUMN processed boolean DEFAULT false`;
			spinner.succeed("Added processed column");
		}

		// Run stats query first
		spinner.text = "Calculating stats...";
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
			WHERE temp.processed = false
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
			spinner.stop();
			console.log("Starting upsert process...");
			let processedCount = 0;
			let batchNumber = 0;

			// First get all IDs
			console.log("Fetching IDs...");
			const allIds = await sql`
				SELECT gml_id
				FROM ${sql(tempTreesTable)}
				WHERE processed = false
				ORDER BY gml_id`;

			// Set transaction isolation level to prevent deadlocks
			await sql`SET TRANSACTION ISOLATION LEVEL SERIALIZABLE`;

			const totalBatches = Math.ceil(allIds.length / batchSize);
			console.log(`Found ${allIds.length} IDs (${totalBatches} batches)`);

			if (allIds.length === 0) {
				console.log("No records found to process");
				return;
			}

			console.log(`Will process in batches of ${batchSize}`);

			// Process in chunks
			for (let i = 0; i < allIds.length; i += batchSize) {
				batchNumber++;
				const idBatch = allIds.slice(i, i + batchSize).map((r) => r.gml_id);

				const currentCount = i + 1;
				const endCount = Math.min(i + batchSize, allIds.length);
				const percentage = Math.round((currentCount / allIds.length) * 100);
				console.log(
					`Batch ${batchNumber}/${totalBatches}: ${currentCount}-${endCount}/${allIds.length} (${percentage}%)`,
				);

				try {
					const result = await sql`
						WITH batch AS (
							SELECT * FROM ${sql(tempTreesTable)}
							WHERE gml_id = ANY(${idBatch})
							AND processed = false
							FOR UPDATE
						),
						inserted AS (
							INSERT INTO trees (
								id,
								lat,
								lng,
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
							FROM batch
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
						UPDATE ${sql(tempTreesTable)} temp
						SET processed = true
						FROM inserted
						WHERE temp.gml_id = inserted.id
						RETURNING temp.gml_id`;

					const affectedCount = result.length;
					processedCount = Number(processedCount) + affectedCount;
					const progressPercent = Math.round((processedCount / total) * 100);
					console.log(
						`  ✓ Affected rows: ${affectedCount} (Total: ${processedCount}/${total} - ${progressPercent}%)`,
					);
				} catch (err: unknown) {
					console.error("Error in batch:", err);
					throw err;
				}
			}

			// Only show final counts
			console.log("\nAll batches completed");
			console.log(`Total records processed: ${processedCount}`);
			const finalCount = await sql`SELECT COUNT(*) as count FROM trees`;
			console.log(`Final count in database: ${finalCount[0].count}`);
			console.log("\nUpsert completed successfully ✓");
		} else {
			spinner.succeed("Dry run complete");
		}
	} catch (error: unknown) {
		spinner.fail(
			`Error: ${error instanceof Error ? error.message : String(error)}`,
		);
		if (error instanceof UserError) {
			throw error;
		}
		throw error;
	} finally {
		spinner.stop();
	}
}
