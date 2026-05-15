import postgres from "postgres";
import { config } from "../config.ts";
import { doesTableExist } from "./utils.ts";
import { UserError } from "../errors.ts";
import ora from "ora";

export async function createTable(sql: postgres.Sql) {
	// return a string that represents the sql statement to create the table
	const { "temp-trees-table": tempTreesTable, "dry-run": dryRun } = config();
	const spinner = ora(`Creating table ${tempTreesTable}`).start();

	try {
		const tableExists = await doesTableExist(sql, tempTreesTable);
		spinner.text = `Checking if table ${tempTreesTable} exists`;
		if (!tableExists) {
			if (dryRun) {
				spinner.info(`[DRY RUN] Would create table ${tempTreesTable}`);
				return;
			}
			await sql`
		CREATE TABLE IF NOT EXISTS ${sql(tempTreesTable)} (
			"gml_id" text,
			"baumid" text,
			"standortnr" text,
			"kennzeich" text,
			"namenr" text,
			"art_dtsch" text,
			"art_bot" text,
			"gattung_deutsch" text,
			"gattung" text,
			"art_gruppe" text,
			"strname" text,
			"strnr" text,
			"hausnr" text,
			"pflanzjahr" int4,
			"standalter" text,
			"stammumfg" text,
			"baumhoehe" float8,
			"bezirk" text,
			"eigentuemer" text,
			"zusatz" text,
			"kronedurch" text,
			"type" text,
			"baumnr" text,
			"objektnr" text,
			"objektname" text,
			"baumart_de" text,
			"baumart_bo" text,
			"gattung_bo" text,
			"kronendurch" float8,
			"kronendurc" float8,
			"stammumfan" float8,
			"eigentueme" text,
			"gisid" text,
			"pitid" text,
			"comment" text,
			"processed" boolean DEFAULT false,
			"geom" geometry(Geometry,4326))

			`;

			const apiRoles = await sql<{ rolname: string }[]>`
				SELECT rolname
				FROM pg_roles
				WHERE rolname IN ('anon', 'authenticated')`;

			for (const { rolname } of apiRoles) {
				await sql`REVOKE ALL ON TABLE ${sql(tempTreesTable)} FROM ${sql(rolname)}`;
			}

			spinner.succeed(`Table ${tempTreesTable} created`);
		} else {
			spinner.fail(`Table ${tempTreesTable} already exists`);
			throw new UserError(`Table ${tempTreesTable} already exists`);
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
