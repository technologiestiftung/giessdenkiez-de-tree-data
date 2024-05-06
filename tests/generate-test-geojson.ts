import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { parseArgs } from "node:util";

async function generateTestGeojson() {
	try {
		const { values } = parseArgs({
			options: {
				"input-file": { type: "string", short: "i" },
				"output-file": { type: "string", short: "o" },
				count: { type: "string", short: "c", default: "1000" },
				help: { type: "boolean", default: false, short: "h" },
			},
		});

		if (values.help) {
			// eslint-disable-next-line no-console
			console.info(`Usage: generate-test-geojson [options]
Options:
	-i, --input-file <path>   Path to input GeoJSON file
	-o, --output-file <path>  Path to output GeoJSON file
	-c, --count <number>      Number of features to generate
	-h, --help                Display this help message
	`);
			process.exit(0);
		}

		if (!values["input-file"]) {
			throw new Error("No input file provided");
		}
		if (!existsSync(values["input-file"])) {
			throw new Error("Input file does not exist");
		}
		const inputFilePath = values["input-file"];
		const txt = await readFile(inputFilePath, "utf-8");
		let geojson;
		try {
			geojson = JSON.parse(txt);
		} catch (e) {
			console.error(e);
			throw new Error("Invalid GeoJSON file");
		}
		if (!geojson) {
			throw new Error("No GeoJSON object provided");
		}
		if (
			!Object.hasOwn(geojson, "type") ||
			geojson.type !== "FeatureCollection"
		) {
			throw new Error("GeoJSON object is not a FeatureCollection");
		}
		if (!Object.hasOwn(geojson, "features")) {
			throw new Error("GeoJSON file does not contain any features");
		}
		if (geojson.features.length === 0) {
			throw new Error("GeoJSON file does not contain any features");
		}

		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		let count = parseInt(values.count!, 10);
		if (isNaN(count)) {
			throw new Error("Invalid count value");
		}
		if (count <= 0) {
			throw new Error("Count must be greater than 0");
		}
		if (count > geojson.features.length) {
			console.warn(
				`Count is greater than the number of features in the GeoJSON file. Using ${geojson.features.length} instead`,
			);
			count = geojson.features.length;
		}

		if (!values["output-file"]) {
			throw new Error("No output file provided");
		}
		const outputFilePath = values["output-file"];
		const features = geojson.features.slice(0, count);
		const output = {
			type: "FeatureCollection",
			features,
		};
		await writeFile(outputFilePath, JSON.stringify(output, null, 2));
		// eslint-disable-next-line no-console
		console.info(`Generated ${count} features to ${outputFilePath}`);
	} catch (error) {
		console.error(error);
		process.exit(1);
	}
}

generateTestGeojson().catch(console.error);
