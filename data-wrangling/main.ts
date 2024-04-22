/**
* We need a table to store the data in

CREATE TABLE "public"."temp_an_trees" (
    "gmlid" text,
    "baumid" text,
    "standortnr" text,
    "kennzeich" text,
    "namenr" text,
    "artdtsch" text,
    "artbot" text,
    "gattungdeutsch" text,
    "gattung" text,
    "art_gruppe" text,
    "pflanzjahr" int4,
    "standalter" text,
    "stammumfg" text,
    "bezirk" text,
    "eigentuemer" text,
    "kronedurch" text,
    "baumhoehe" text,
    geom geometry(Geometry,4326)
);

CREATE TABLE "public"."temp_trees" (
    "gmlid" text,
    "baumid" text,
    "standortnr" text,
    "kennzeich" text,
    "namenr" text,
    "artdtsch" text,
    "artbot" text,
    "gattungdeutsch" text,
    "gattung" text,
    "art_gruppe" text,
    "strname" text,
    "hausnr" text,
    "pflanzjahr" int4,
    "standalter" text,
    "stammumfg" text,
    "baumhoehe" text,
    "bezirk" text,
    "eigentuemer" text,
    "zusatz" text,
    "kronedurch" text,
    geom geometry(Geometry,4326)
);

*/
import postgres from "npm:postgres";
import { parse } from "jsr:@std/yaml";
import { parseArgs } from "jsr:@std/cli/parse-args";
import { MultiProgressBar } from "jsr:@deno-library/progress";
import { delay } from "jsr:@std/async";
// import the geojson file
import geojson from "../tree_data/data_files/s_wfs_baumbestand_2024-4-19.geo.json" with {
	type: "json",
};

const tableName = "temp_trees";

// Learn more at https://deno.land/manual/examples/module_metadata#concepts
if (import.meta.main) {
	const bars = new MultiProgressBar({
		title: "Importing Trees",
		clear: true,
		complete: "=",
		incomplete: "-",
		display: "[:bar] :text :percent :time :completed/:total",
	});
	const flags = parseArgs(Deno.args, {
		boolean: ["help", "create-table", "import-geojson"],
		default: { "create-table": false, "import-geojson": false },
		negatable: ["create-table", "import-geojson"],
	});
	if (flags.help) {
		console.log("Usage: deno run main.ts [OPTIONS]");
		Deno.exit();
	}
	const configText = await Deno.readTextFile(
		`${Deno.cwd()}/tree_data/conf.yml`,
	);
	const config = parse(configText);
	const props = {};
	geojson.features.forEach((feature) => {
		const keys = Object.keys(feature.properties);
		keys.forEach((key) => {
			const newKey = config["data-schema"]["mapping"][key] || key;
			if (!props[newKey] && (feature.properties[key] !== null)) {
				props[newKey] = typeof feature.properties[key];
			}
		});
	});

	const sql = postgres({
		host: "localhost",
	});

	//
	if (flags["create-table"]) {
		console.log("create table");
		const types = Object.keys(props).map((key) => {
			const type = props[key];
			if (type === "string") {
				return `${key} TEXT`;
			} else if (type === "number") {
				return `${key} NUMERIC`;
			} else {
				return `${key} TEXT`;
			}
		});
		const createTable = `CREATE TABLE IF NOT EXISTS ${tableName} (${
			types.join(", ")
		});`;
		console.log("Currently only creating statements");
		console.log(createTable);
		Deno.exit(0);
	}
	if (flags["import-geojson"]) {
		const keys = Object.keys(props);

		const trees = [];
		const total = geojson.features.length;
		for (let i = 0; i < total; i++) {
			await bars.render([{
				completed: i + 1,
				total,
				text: "trees imported:",
				complete: "*",
				incomplete: ".",
			}]);
			const feature = geojson.features[i];
			const values = keys.map((key) => {
				const origKey =
					Object.keys(config["data-schema"]["mapping"]).find((k) =>
						config["data-schema"]["mapping"][k] === key
					) || key;
				const res = {};

				res[key] = feature.properties[origKey];
				return res;
			});
			// convert from the
			// coordinate system
			// https://fbinter.stadt-berlin.de/fb/index.jsp?loginkey=zoomStart&mapId=k_wfs_baumbestand@senstadt&bbox=389138,5819243,390887,5820322
			// ETRS89 / UTM zone 33N
			const geom =
				await sql`SELECT ST_Transform(ST_SetSRID(ST_GeomFromGeoJSON(${
					JSON.stringify(feature.geometry)
				}), 25833), 4326) as geom`;

			values.push(geom[0]);

			const tree = {};
			// Iterate over your array of objects
			values.forEach((obj) => {
				// Use Object.assign() to merge the current object into the combinedObject
				Object.assign(tree, obj);
			});

			tree["gmlid"] = tree["gmlid"].split(".")[1];
			await sql`insert into ${sql(tableName)} ${sql(tree)}`;
			//await delay(1);
		} // end of geojson.features loop

		///
	}
	await sql.end();
}
