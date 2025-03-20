#!/usr/bin/env node

import { createDatabeConnection } from "./db.ts";
import { PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE } from "./env.ts";
import { parseArgs } from "node:util";
import { geojsonImporter } from "./geojson-import.ts";
import { UserError } from "./errors.ts";
import { config, setUserConfig } from "./config.ts";
import type { TreeType } from "./common.ts";
import { createTable } from "./db/create-table.ts";
import { insertGeoJson } from "./db/insert-geojson.ts";
import { deleteTrees } from "./db/delete-trees.ts";
import { upsertTrees } from "./db/upsert-trees.ts";
import { cleanUp } from "./db/clean-up.ts";
import { getWfsData } from "./get-wfs-data.ts";
// const spinner = ora("Loading unicorns").start();

// const args = [
// 	"--create-temp-table",
// 	// "--import-geojson=./tests/data/feature-collection-an-100000.geo.json",
// 	"--pghost=localhost",
// ];

let treeType: TreeType | undefined = undefined;
let comment: string | undefined = undefined;

async function cli() {
	try {
		const {
			values,
			tokens: _tokens,
			positionals: _positionals,
		} = parseArgs({
			// args,
			options: {
				"get-wfs-data": { type: "boolean" },
				"create-temp-table": { type: "boolean", default: false, short: "c" },
				"temp-trees-tablename": {
					type: "string",
					default: "temp_trees",
					short: "n",
				},
				comment: { type: "string", short: "m" },
				"set-tree-type": { type: "string", short: "t" },
				"upsert-trees": { type: "boolean", default: false, short: "u" },
				"dry-run": { type: "boolean", default: false, short: "r" },
				"delete-trees": { type: "boolean", default: false, short: "d" },
				help: { type: "boolean", default: false, short: "h" },
				"import-geojson": { type: "string", short: "i" },
				"clean-up": { type: "boolean" },
				pghost: { type: "string", default: PGHOST },
				pgport: { type: "string", default: PGPORT },
				pguser: { type: "string", default: PGUSER },
				pgpassword: { type: "string", default: PGPASSWORD },
				pgdatabase: { type: "string", default: PGDATABASE },
			},
			tokens: true,
		});
		setUserConfig({
			"dry-run": values["dry-run"],
			"temp-trees-table": values["temp-trees-tablename"],
		});

		const { "temp-trees-table": temp_trees_table } = config();

		if (values.help) {
			// eslint-disable-next-line no-console
			console.info(`Usage: command [options]
Options:
  -h, --help                Output usage information and exit.
  -c, --create-temp-table   Create a new table ${temp_trees_table} and exit. Default is false.
  -i, --import-geojson      Specify the path to the GeoJSON file you want to import.
  -d --delete-trees         Delete all trees from the database that are not in the ${temp_trees_table}.
  -m --comment              Specify the comment for the trees when inserted into the database.
  -u --upsert-trees         Upsert all trees from the ${temp_trees_table} into the database.
  -r, --dry-run             Perform a dry run. Default is false.
  -t --set-tree-type        Specify the type of tree during import.
  -n --temp-trees-tablename Specify the name of the temporary trees table. Default is "temp_trees".
                            Can be "anlage" or "strasse". Default is null.
      --get-wfs-data        Make a webreqwuets to the WFS server and save the data to a file.

      --clean-up            Removes all temp tables.

      --pghost              Specify the PostgreSQL host.
                            Default is the value of the PGHOST environment variable.

      --pgport              Specify the PostgreSQL port.
                            Default is the value of the PGPORT environment variable.

      --pguser              Specify the PostgreSQL user.
                            Default is the value of the PGUSER environment variable.

      --pgpassword          Specify the PostgreSQL password.
                            Default is the value of the PGPASSWORD environment variable.

      --pgdatabase          Specify the PostgreSQL database.
                            Default is the value of the PGDATABASE environment variable.
`);
			process.exit(0);
		}

		const { pgport, pgdatabase, pghost, pgpassword, pguser } = values;
		if (!pgport) {
			throw new UserError(
				"The pgport option not set and not defined in the env.",
			);
		}
		const port = !isNaN(parseInt(pgport, 10))
			? parseInt(pgport, 10)
			: undefined;
		if (!port) {
			throw new UserError("The pgport option should be a number.");
		}

		if (!pgdatabase) {
			throw new UserError(
				"The pgdatabase option not set and not defined in the env.",
			);
		}
		const database = pgdatabase;
		if (!pghost) {
			throw new UserError(
				"The pghost option not set and not defined in the env.",
			);
		}
		const host = pghost;
		if (!pgpassword) {
			throw new UserError(
				"The pgpassword option not set and not defined in the env.",
			);
		}

		const password = pgpassword;
		if (!pguser) {
			throw new UserError(
				"The pguser option not set and not defined in the env.",
			);
		}
		const username = pguser;

		const databaseOptions = {
			host,
			port,
			database,
			username,
			password,
		};

		if (values["comment"]) {
			comment = values["comment"];
		}

		if (values["get-wfs-data"]) {
			await getWfsData();
			process.exit(0);
		}
		if (values["create-temp-table"]) {
			const sql = createDatabeConnection(databaseOptions);
			await createTable(sql);
			process.exit(0);
		}

		if (values["set-tree-type"]) {
			if (
				values["set-tree-type"] !== "anlage" &&
				values["set-tree-type"] !== "strasse"
			) {
				throw new UserError(
					'Invalid tree type. Must be "anlage" or "strasse".',
				);
			}

			treeType = values["set-tree-type"] as TreeType;
		}

		if (values["import-geojson"]) {
			const sql = createDatabeConnection(databaseOptions);
			const geojson = await geojsonImporter({
				filePath: values["import-geojson"],
				comment,
			});

			await insertGeoJson(sql, geojson, {
				treeType,
			});
			process.exit(0);
		}

		if (values["delete-trees"]) {
			const sql = createDatabeConnection(databaseOptions);
			await deleteTrees(sql);
			process.exit(0);
		}

		if (values["upsert-trees"]) {
			const sql = createDatabeConnection(databaseOptions);
			await upsertTrees(sql);
			process.exit(0);
		}

		if (values["clean-up"]) {
			const sql = createDatabeConnection(databaseOptions);
			await cleanUp(sql);
			process.exit(0);
		}
	} catch (e: unknown) {
		if (e instanceof TypeError) {
			console.error(e.message);
		}
		if (e instanceof UserError) {
			console.error(e.message);
		}
		process.exit(1);
	}
}

cli().catch(console.error);
