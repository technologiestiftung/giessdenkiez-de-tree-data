import postgres from "postgres";
import { UserError } from "../errors.js";
import { config } from "../config.js";
import ora from "ora";
import { doesTableExist } from "./utils.js";

export async function upsertTrees(sql: postgres.Sql) {
	const spinner = ora("Starting upsert").start();

	const { "temp-trees-table": tempTreesTable, "dry-run": dryRun } = config();
	try {
		if (!dryRun) {
			const tableExists = await doesTableExist(sql, tempTreesTable);
			if (!tableExists) {
				spinner.fail(`Table ${tempTreesTable} does not exists`);
				throw new UserError(`Table ${tempTreesTable} does not exists`);
			}
			spinner.text = `Checking ${tempTreesTable}`;
			const result = await sql`select count(1) from ${sql(tempTreesTable)};`;
			spinner.text = `This will upsert ${result[0].count} records`;
			const upsertResult = await sql`
			INSERT INTO trees (gml_id, standortnr, kennzeich,  art_dtsch, art_bot, gattung_deutsch, gattung, strname, hausnr,
				pflanzjahr, standalter, stammumfg, baumhoehe, bezirk, eigentuemer, zusatz, kronedurch, "type", geom)
				SELECT
						gml_id,
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
						geom
				FROM ${sql(tempTreesTable)} AS temp_trees
				ON CONFLICT (gml_id)
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
						geom = excluded.geom
			`;
			spinner.succeed(`Upserted records`);
		}
	} catch (error) {
		if (error instanceof UserError) {
			await sql.end();
			throw error;
		}
		console.error(error);
		await sql.end();
		process.exit(1);
	}
}
