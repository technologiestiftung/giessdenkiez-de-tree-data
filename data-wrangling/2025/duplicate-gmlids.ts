import postgres from "postgres";
import fs from "node:fs/promises";
import path from "node:path";

const dburl = `postgres://${process.env.PGUSER}:${process.env.PGPASSWORD}@${process.env.PGHOST}:${process.env.PGPORT}/${process.env.PGDATABASE}`;
const sql = postgres(dburl);

async function exportDuplicatesWithinGroups() {
	try {
		const outputDir = "./duplicate_trees";
		await fs.mkdir(outputDir, { recursive: true });

		// Get all duplicate gml_ids
		const duplicateIds = await sql`
      SELECT gml_id, COUNT(*) as count
      FROM temp_trees
      GROUP BY gml_id
      HAVING COUNT(*) > 1
      ORDER BY gml_id
    `;

		console.log(`Found ${duplicateIds.length} groups with duplicates`);
		// Process each group separately
		for (const [index, { gml_id, count }] of duplicateIds.entries()) {
			// Create a directory for this group
			const groupDir = path.join(outputDir, `group_${index}`);
			await fs.mkdir(groupDir, { recursive: true });
			// Get all trees in this group
			const trees = await sql`
        SELECT *, ST_AsGeoJSON(geom) AS geom_json
        FROM temp_trees
        WHERE gml_id = ${gml_id}
      `;

			// Export each tree with its own index within the group
			for (let i = 0; i < trees.length; i++) {
				const tree = trees[i];
				const { geom_json, ...properties } = tree;

				// Create feature
				const feature = {
					type: "Feature",
					geometry: JSON.parse(geom_json),
					properties: {
						...properties,
						group_index: index,
						duplicate_index: i,
						total_in_group: trees.length,
					},
				};

				// Create FeatureCollection
				const featureCollection = {
					type: "FeatureCollection",
					features: [feature],
				};

				// Export as GeoJSON
				await fs.writeFile(
					path.join(groupDir, `dupe_${i}.geojson`),
					JSON.stringify(featureCollection, null, 2),
				);

				// Also export as LDJSON
				await fs.writeFile(
					path.join(groupDir, `dupe_${i}.ldjson`),
					JSON.stringify(feature),
				);
			}

			// Create a group index
			const groupIndex = {
				gml_id,
				count: Number(count),
				files: Array.from(
					{ length: trees.length },
					(_, i) => `dupe_${i}.geojson`,
				),
			};

			await fs.writeFile(
				path.join(groupDir, "index.json"),
				JSON.stringify(groupIndex, null, 2),
			);

			console.log(
				`Exported group ${groupIndex} (gml_id: ${gml_id}) with ${count} duplicates`,
			);
		}

		console.log("Export complete!");
	} catch (error) {
		console.error("Error:", error);
	} finally {
		await sql.end();
	}
}

exportDuplicatesWithinGroups();
