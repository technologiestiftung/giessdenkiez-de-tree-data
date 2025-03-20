import fs from "node:fs/promises";
import path from "node:path";

async function combineGroupDuplicates() {
	try {
		const baseDir = "./duplicate_trees";
		const groupDirs = await fs.readdir(baseDir);

		// Create a map to collect features by duplicate index
		const duplicateCollections: Record<number, any[]> = {};

		// Process each group directory
		for (const groupDir of groupDirs.filter((dir) =>
			dir.startsWith("group_"),
		)) {
			const groupPath = path.join(baseDir, groupDir);
			const files = await fs.readdir(groupPath);

			// Process each geojson file (skip index.json and ldjson files)
			for (const file of files.filter(
				(f) => f.endsWith(".geojson") && f !== "index.json",
			)) {
				const dupeIndex = parseInt(
					file.match(/dupe_(\d+)\.geojson/)?.[1] ?? "",
				);
				if (isNaN(dupeIndex)) continue;

				const content = JSON.parse(
					await fs.readFile(path.join(groupPath, file), "utf-8"),
				);

				// Initialize array for this duplicate index if it doesn't exist
				duplicateCollections[dupeIndex] = duplicateCollections[dupeIndex] || [];

				// Add the feature to the appropriate collection
				duplicateCollections[dupeIndex].push(...content.features);
			}
		}

		// Write combined files
		for (const [index, features] of Object.entries(duplicateCollections)) {
			const featureCollection = {
				type: "FeatureCollection",
				features,
			};

			await fs.writeFile(
				path.join(baseDir, `dupes_${index}.geojson`),
				JSON.stringify(featureCollection, null, 2),
			);
		}

		console.log("Combined duplicate files successfully!");
	} catch (error) {
		console.error("Error:", error);
	}
}

combineGroupDuplicates();
