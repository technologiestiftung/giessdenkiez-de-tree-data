/*eslint complexity: ["error", 30]*/
/*eslint max-lines: ["error", 300]*/
import type { FeatureCollection } from "geojson";
import type { TreeType } from "../common.ts";
import postgres from "postgres";
import { config } from "../config.ts";
import { doesTableExist } from "./utils.ts";
import { UserError } from "../errors.ts";
import ora from "ora";
import { sanitizePflanzjahr } from "./sanitize-tree-values.ts";
import { createImportReport } from "./import-report.ts";

function toFiniteNumber(value: unknown): number | null {
	if (typeof value === "number") {
		return Number.isFinite(value) ? value : null;
	}
	if (typeof value !== "string") {
		return null;
	}
	const trimmed = value.trim();
	if (!trimmed || !/^-?\d+(\.\d+)?([eE][-+]?\d+)?$/.test(trimmed)) {
		return null;
	}
	const parsed = Number(trimmed);
	return Number.isFinite(parsed) ? parsed : null;
}

function suspiciousPflanzjahrReason(value: unknown): string | null {
	if (value === null || value === undefined || value === "") {
		return null;
	}
	const numeric = toFiniteNumber(value);
	if (numeric === null) {
		return "not-numeric";
	}
	if (!Number.isInteger(numeric)) {
		return "not-integer";
	}
	const currentYear = new Date().getFullYear() + 1;
	if (numeric < 1800) {
		return "below-1800";
	}
	if (numeric > currentYear) {
		return `above-${currentYear}`;
	}
	return null;
}

function suspiciousStandalterReason(value: unknown): string | null {
	if (value === null || value === undefined || value === "") {
		return null;
	}
	const numeric = toFiniteNumber(value);
	if (numeric === null) {
		return "not-numeric";
	}
	if (numeric < 0) {
		return "negative";
	}
	if (numeric > 500) {
		return "above-500";
	}
	return null;
}

export async function insertGeoJson(
	sql: postgres.Sql,
	geojson: FeatureCollection,
	options: { treeType: TreeType | undefined; sourceFilePath: string },
) {
	let report: Awaited<ReturnType<typeof createImportReport>> | null = null;
	let reportFinalized = false;
	try {
		const { treeType, sourceFilePath } = options;
		const spinner = ora("Importing GeoJSON").start();
		report = await createImportReport({
			sourceFilePath,
			treeType,
			totalFeatures: geojson.features.length,
		});
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
		let invalidPflanzjahrCount = 0;
		let suspiciousPflanzjahrCount = 0;
		let suspiciousStandalterCount = 0;
		let missingGmlIdCount = 0;
		let missingGmlIdWithPitIdCount = 0;
		for (let i = 0; i < total; i++) {
			spinner.text = `Importing ${i + 1}/${total} trees`;
			const feature = geojson.features[i];
			const properties = feature.properties;
			if (!properties) {
				continue;
			}

			const geom =
				await sql`SELECT ST_SetSRID(ST_GeomFromGeoJSON(${JSON.stringify(
					feature.geometry,
				)}), 4326) as geom`;

			const pitid =
				typeof properties["pitid"] === "string" ? properties["pitid"] : null;
			const gisid =
				typeof properties["gisid"] === "string" ? properties["gisid"] : null;

			const sanitizedPflanzjahr = sanitizePflanzjahr(properties["pflanzjahr"]);
			if (properties["pflanzjahr"] !== null && sanitizedPflanzjahr === null) {
				invalidPflanzjahrCount++;
				report.recordInvalidPflanzjahr({
					index: i,
					value: properties["pflanzjahr"],
					pitid,
					gisid,
				});
			}

			const pflanzjahrReason = suspiciousPflanzjahrReason(
				properties["pflanzjahr"],
			);
			if (pflanzjahrReason) {
				suspiciousPflanzjahrCount++;
				report.recordSuspiciousPflanzjahr({
					index: i,
					value: properties["pflanzjahr"],
					reason: pflanzjahrReason,
					pitid,
					gisid,
				});
			}

			const standalterReason = suspiciousStandalterReason(
				properties["standalter"],
			);
			if (standalterReason) {
				suspiciousStandalterCount++;
				report.recordSuspiciousStandalter({
					index: i,
					value: properties["standalter"],
					reason: standalterReason,
					pitid,
					gisid,
				});
			}

			const tree: Record<string, string | number | null> = {
				...properties,
				pflanzjahr: sanitizedPflanzjahr,
				geom: geom[0].geom,
				type: treeType ?? null,
			};

			if (!tree["gml_id"]) {
				missingGmlIdCount++;
				report.recordMissingGmlId({
					index: i,
					pitid,
					gisid,
				});
				if (typeof tree["pitid"] === "string" && tree["pitid"].length > 0) {
					missingGmlIdWithPitIdCount++;
				}
			}

			trees.push(tree);

			if (trees.length === 1000 || i === total - 1) {
				if (!dryRun) {
					await sql`insert into ${sql(tempTreesTable)} ${sql(trees)}`;
				}
				trees = []; // reset the trees array
			}
		}
		const reportPath = await report.finalize();
		reportFinalized = true;
		spinner.succeed(
			`${dryRun ? "[DRY RUN] Would import" : "Imported"} all trees. ` +
				`Invalid pflanzjahr -> NULL: ${invalidPflanzjahrCount}. ` +
				`Suspicious pflanzjahr: ${suspiciousPflanzjahrCount}. ` +
				`Suspicious standalter: ${suspiciousStandalterCount}. ` +
				`Missing gml_id: ${missingGmlIdCount} (${missingGmlIdWithPitIdCount} with pitid). ` +
				`Report: ${reportPath}`,
		);
	} catch (error: unknown) {
		if (report && !reportFinalized) {
			try {
				await report.finalize();
				reportFinalized = true;
			} catch (finalizeError) {
				console.error(finalizeError);
			}
		}
		if (error instanceof UserError) {
			await sql.end();
			throw error;
		}
		console.error(error);
		await sql.end();
		process.exit(1);
	}
}
