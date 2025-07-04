import postgres from "postgres";
import { UserError } from "../errors.ts";
import { config } from "../config.ts";
import ora from "ora";
import { doesTableExist } from "./utils.ts";

export async function upsertTrees(sql: postgres.Sql, batchSize = 500) {
	const { "temp-trees-table": tempTreesTable, "dry-run": dryRun } = config();
	const spinner = ora(`${dryRun ? "[DRY RUN] " : ""}Starting upsert`).start();

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

		if (dryRun) {
			spinner.info(`[DRY RUN] Would perform:
		- ${insertCount} inserts
		- ${updateCount} updates
		- ${total} total operations`);
			return;
		}

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

				const MAX_RETRIES = 3;
				let retries = 0;
				let lastError: unknown;

				while (retries < MAX_RETRIES) {
					try {
						await sql.begin(async (sql) => {
							// Set transaction isolation level inside the transaction
							await sql`SET TRANSACTION ISOLATION LEVEL SERIALIZABLE`;

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
							const progressPercent = Math.round(
								(processedCount / total) * 100,
							);
							console.log(
								`  ✓ Affected rows: ${affectedCount} (Total: ${processedCount}/${total} - ${progressPercent}%)`,
							);
						});
						break; // Success, exit retry loop
					} catch (err: unknown) {
						lastError = err;
						retries++;

						if (retries === MAX_RETRIES) {
							console.error(
								`Failed after ${MAX_RETRIES} retries. Last error:`,
								lastError,
							);
							throw lastError;
						}

						// Exponential backoff: 1s, 2s, 4s
						const delay = Math.pow(2, retries - 1) * 1000;
						console.log(`Retry ${retries}/${MAX_RETRIES} after ${delay}ms...`);
						await new Promise((r) => setTimeout(r, delay));
					}
				}
			}

			// Only show final counts
			console.log("\nAll batches completed");
			console.log(`Total records processed: ${processedCount}`);
			const finalCount = await sql`SELECT COUNT(*) as count FROM trees`;
			console.log(`Final count in database: ${finalCount[0].count}`);
			console.log("\nUpsert completed successfully ✓");
		} else {
			spinner.succeed("[DRY RUN] Complete");
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
