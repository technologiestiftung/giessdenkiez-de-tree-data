// import ora from "ora";
import { createDatabeConnection } from "./db.js";
import { PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE } from "./env.js";
import { parseArgs } from "node:util";
import { geojsonImporter } from "./geojson-import.js";
import { UserError } from "./errors.js";
import { config, setUserConfig } from "./config.js";
import { TreeType } from "./common.js";
import { createTable } from "./db/create-table.js";
import { insertGeoJson } from "./db/insert-geojson.js";
import { deleteTrees } from "./db/delete-trees.js";
import { upsertTrees } from "./db/upsert-trees.js";
import { cleanUp } from "./db/clean-up.js";
// const spinner = ora("Loading unicorns").start();

// const args = [
// 	"--create-temp-table",
// 	// "--import-geojson=./tests/data/feature-collection-an-100000.geo.json",
// 	"--pghost=localhost",
// ];

let treeType: TreeType | undefined = undefined;

async function cli() {
	try {
		const {
			values,
			tokens: _tokens,
			positionals: _positionals,
		} = parseArgs({
			// args,
			options: {
				"create-temp-table": { type: "boolean", default: false, short: "c" },
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

		setUserConfig({ "dry-run": values["dry-run"] });

		const { "temp-trees-table": temp_trees_table } = config();

		if (values.help) {
			// eslint-disable-next-line no-console
			console.info(`Usage: command [options]
Options:
  -h, --help               Output usage information and exit.
  -c, --create-temp-table  Create a new table ${temp_trees_table} and exit. Default is false.
  -i, --import-geojson     Specify the path to the GeoJSON file you want to import.
  -d --delete-trees        Delete all trees from the database that are not in the ${temp_trees_table}.
  -u --upsert-trees        Upsert all trees from the ${temp_trees_table} into the database.
  -r, --dry-run            Perform a dry run. Default is false.
  -t --set-tree-type       Specify the type of tree during import.
                           Can be "anlage" or "strasse". Default is null.

      --clean-up           Removes all temp tables.

      --pghost             Specify the PostgreSQL host.
                           Default is the value of the PGHOST environment variable.

      --pgport             Specify the PostgreSQL port.
                           Default is the value of the PGPORT environment variable.

      --pguser             Specify the PostgreSQL user.
                           Default is the value of the PGUSER environment variable.

      --pgpassword         Specify the PostgreSQL password.
                           Default is the value of the PGPASSWORD environment variable.

      --pgdatabase         Specify the PostgreSQL database.
                           Default is the value of the PGDATABASE environment variable.
`);
			process.exit(0);
		}

		if (values["create-temp-table"]) {
			const sql = createDatabeConnection({ host: values.pghost });
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
			const sql = createDatabeConnection({
				host: values.pghost,
			});
			const geojson = await geojsonImporter({
				filePath: values["import-geojson"],
			});

			await insertGeoJson(sql, geojson, {
				treeType,
			});
			process.exit(0);
		}

		if (values["delete-trees"]) {
			const sql = createDatabeConnection({
				host: values.pghost,
			});
			await deleteTrees(sql);
			process.exit(0);
		}

		if (values["upsert-trees"]) {
			const sql = createDatabeConnection({
				host: values.pghost,
			});
			await upsertTrees(sql);
			process.exit(0);
		}

		if (values["clean-up"]) {
			const sql = createDatabeConnection({
				host: values.pghost,
			});
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
