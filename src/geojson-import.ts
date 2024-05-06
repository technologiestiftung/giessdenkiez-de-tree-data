import path from "node:path";
import { fileExists } from "./utils.js";
import { readFile } from "node:fs/promises";
import { FeatureCollection } from "geojson";
/**
 * Import a GeoJSON file from a specific path. Returns the parsed GeoJSON object.
 */
export async function geojsonImporter({
	filePath,
}: {
	filePath: string;
}): Promise<FeatureCollection> {
	try {
		// 1. check if the file at the path exists
		// 2. read the file
		// 3. parse the file

		const fullPath = path.resolve(process.cwd(), filePath);
		const fileDoesExists = await fileExists(fullPath);
		if (!fileDoesExists) {
			throw new Error(`File does not exists at path: ${fullPath}`);
		}

		const file = await readFile(fullPath, "utf-8");
		const json = JSON.parse(file) as FeatureCollection;
		return json;
	} catch (e: unknown) {
		if (e instanceof Error) {
			console.error(e.message);
		} else {
			console.error(e);
		}
		throw e;
	}
}
