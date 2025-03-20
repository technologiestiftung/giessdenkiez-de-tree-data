import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

interface Feature {
	type: string;
	geometry:
		| string
		| {
				type: string;
				coordinates: number[][];
		  };
	properties: Record<string, any>;
}

interface GeoJSON {
	type: string;
	features: Feature[];
}

function convertLineStringToGeoJSON(
	inputFile: string,
	outputFile: string,
): void {
	try {
		console.log(`Converting ${inputFile} to ${outputFile}...`);

		// Read the input GeoJSON file
		const data: GeoJSON = JSON.parse(readFileSync(inputFile, "utf-8"));

		// Convert each feature's geometry
		for (const feature of data.features) {
			// Extract coordinates from LINESTRING format
			const geometryStr = feature.geometry as string;
			// Remove SRID prefix and get coordinates
			const coordsMatch = geometryStr.match(/LINESTRING\((.*?)\)/);
			if (!coordsMatch) {
				console.warn(`Skipping feature with invalid geometry: ${geometryStr}`);
				continue;
			}

			const coordsStr = coordsMatch[1];
			// Split into coordinate pairs and convert to float
			const coords = coordsStr.split(",").map((pair) => {
				const [x, y] = pair.trim().split(" ");
				return [parseFloat(x), parseFloat(y)];
			});

			// Replace with proper GeoJSON geometry
			feature.geometry = {
				type: "LineString",
				coordinates: coords,
			};
		}

		// Write the converted GeoJSON
		writeFileSync(outputFile, JSON.stringify(data, null, 2));
		console.log(`Successfully converted ${inputFile}`);
	} catch (error) {
		console.error(`Error processing ${inputFile}:`, error);
		process.exit(1);
	}
}

// Get the current working directory
const cwd = process.cwd();

const inputFiles = [
	join(
		cwd,
		"data-wrangling/2025/duplicate_trees/dupes_gruen_street_line.geojson",
	),
	join(
		cwd,
		"data-wrangling/2025/duplicate_trees/dupes_gruen_anlage_line.geojson",
	),
];
const outputFiles = [
	join(
		cwd,
		"data-wrangling/2025/duplicate_trees/dupes_gruen_street_line_converted.geojson",
	),
	join(
		cwd,
		"data-wrangling/2025/duplicate_trees/dupes_gruen_anlage_line_converted.geojson",
	),
];

for (let i = 0; i < inputFiles.length; i++) {
	convertLineStringToGeoJSON(inputFiles[i], outputFiles[i]);
}
