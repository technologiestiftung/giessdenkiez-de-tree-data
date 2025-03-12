import type { FeatureCollection } from "geojson";
import type { TreeType } from "../common.ts";
import postgres from "postgres";
import { config } from "../config.ts";
import { doesTableExist } from "./utils.ts";
import { UserError } from "../errors.ts";
import ora from "ora";

export async function insertGeoJson(
	sql: postgres.Sql,
	geojson: FeatureCollection,
	options: { treeType: TreeType | undefined },
) {
	try {
		const { treeType } = options;
		const spinner = ora("Importing GeoJSON").start();
		const { "temp-trees-table": tempTreesTable, "dry-run": dryRun } = config();
		const tableExists = await doesTableExist(sql, tempTreesTable);
		if (!tableExists) {
			throw new UserError(`Table ${tempTreesTable} does not exists`);
		}
		if (!geojson) {
			throw new UserError("No GeoJSON object provided");
		}
		if (
			!Object.hasOwn(geojson, "type") ||
			geojson.type !== "FeatureCollection"
		) {
			throw new UserError("GeoJSON object is not a FeatureCollection");
		}

		if (!Object.hasOwn(geojson, "features")) {
			throw new UserError("GeoJSON file does not contain any features");
		}
		if (geojson.features.length === 0) {
			throw new UserError("GeoJSON file does not contain any features");
		}
		const props: Record<string, string | number | null> = {};
		geojson.features.forEach((feature) => {
			if (!Object.hasOwn(feature, "type") || feature.type !== "Feature") {
				throw new UserError("GeoJSON file contains an invalid feature");
			}

			const properties = feature.properties;
			if (properties === null) {
				return;
			}
			const keys = Object.keys(properties);
			keys.forEach((key) => {
				if (!props[key] && properties[key] !== null) {
					props[key] = typeof properties[key];
				}
			});
		});

		const total = geojson.features.length;
		let trees: Record<string, string | number | null>[] = [];
		for (let i = 0; i < total; i++) {
			spinner.text = `Importing ${i + 1}/${total} trees`;
			const feature = geojson.features[i];
			const properties = feature.properties;
			if (!properties) {
				continue;
			}

			const geom =
				await sql`SELECT ST_Transform(ST_SetSRID(ST_GeomFromGeoJSON(${JSON.stringify(
					feature.geometry,
				)}), 25833), 4326) as geom`;

			const tree: Record<string, string | number | null> = {
				...properties,
				// manually parse the pflanzjahr to a number
				pflanzjahr: isNaN(parseInt(properties["pflanzjahr"]))
					? null
					: parseInt(properties["pflanzjahr"]),
				geom: geom[0].geom,
				type: treeType ?? null,
			};

			tree["gml_id"] =
				tree["gml_id"] && typeof tree["gml_id"] === "string"
					? tree["gml_id"].split(".")[1]
					: null;

			trees.push(tree);

			if (trees.length === 1000 || i === total - 1) {
				if (!dryRun) {
					await sql`insert into ${sql(tempTreesTable)} ${sql(trees)}`;
				}
				trees = []; // reset the trees array
			}
		}
		spinner.succeed("Imported all trees");
	} catch (error: unknown) {
		if (error instanceof UserError) {
			await sql.end();
			throw error;
		}
		console.error(error);
		await sql.end();
		process.exit(1);
	}
}
