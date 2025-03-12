import postgres from "postgres";
import { config } from "../config.ts";
import { doesTableExist } from "./utils.ts";
import { UserError } from "../errors.ts";
import ora from "ora";

export async function cleanUp(sql: postgres.Sql) {
	const { "temp-trees-table": tempTreesTable, "dry-run": dryRun } = config();
	const spinner = ora("Starting clean-up").start();

	try {
		const tableExists = await doesTableExist(sql, tempTreesTable);
		if (!tableExists) {
			spinner.fail(`Table ${tempTreesTable} does not exists`);
			throw new UserError(`Table ${tempTreesTable} does not exists`);
		}

		const result = await sql`select count(1) from ${sql(tempTreesTable)};`;
		spinner.text = `This will drop ${tempTreesTable}`;

		if (!dryRun) {
			await sql`DROP table ${sql(tempTreesTable)};`;
		}
		spinner.succeed(`Dropped ${tempTreesTable}`);
	} catch (e) {}
}
