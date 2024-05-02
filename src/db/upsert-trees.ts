import postgres from "postgres";
import { UserError } from "../errors.js";
import { config } from "../config.js";

export async function upsertTrees(sql: postgres.Sql) {
	const { "temp-trees-table": tempTreesTable, "dry-run": dryRun } = config();
	try {
		if (!dryRun) {
			const result = await sql`select count(1) from ${sql(tempTreesTable)};`;

			const upsertResult = await sql`
			INSERT INTO trees (gml_id, standortnr, kennzeich, namenr, art_dtsch, art_bot, gattung_deutsch, gattung, strname, hausnr, pflanzjahr, standalter, stammumfg, baumhoehe, bezirk, eigentuemer, zusatz, kronedurch, "type", geom)
			SELECT
				gml_id,
				standortnr,
				kennzeich,
				namenr,
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
			FROM
				${sql(tempTreesTable)} AS temp_trees
			WHERE
				NOT EXISTS (
					SELECT
						1
					FROM
						trees
					WHERE
						trees.gml_id = temp_trees.gml_id) ON CONFLICT (gml_id)
					DO
					UPDATE
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
						geom = excluded.geom;
			`;
			console.log(result);
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
