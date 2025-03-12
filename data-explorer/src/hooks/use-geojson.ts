import type { SupabaseClient } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";
import { createFeatureCollection } from "../lib/create-feature-colection.ts";
export function useGeojson(supabaseClient: SupabaseClient) {
	const [geojson, setGeojson] = useState<
		GeoJSON.FeatureCollection<GeoJSON.Geometry> | undefined
	>(undefined);
	const memoizedInitGeojson = useCallback(initGeojson, [supabaseClient]);
	async function initGeojson() {
		console.log("initGeojson");
		let allTrees: any[] = [];
		let from = 0;
		const batchSize = 10000;

		while (true) {
			const {
				data: trees,
				error,
				count,
			} = await supabaseClient
				.from("trees")
				.select("*", { count: "exact" })
				.range(from, from + batchSize - 1);

			if (error) throw error;
			if (!trees?.length) break;

			allTrees = [...allTrees, ...trees];
			console.log(`Loaded ${allTrees.length} trees of ${count}`);

			if (trees.length < batchSize) break;
			from += batchSize;
		}

		console.log("Total trees loaded:", allTrees.length);
		const featureCollection = createFeatureCollection(allTrees);
		setGeojson(featureCollection);
	}
	useEffect(() => {
		memoizedInitGeojson().catch(console.error);
	}, [memoizedInitGeojson]);
	return { geojson, setGeojson, initGeojson };
}
