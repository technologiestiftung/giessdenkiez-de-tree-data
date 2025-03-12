import { useEffect, useRef, useState } from "react";
import "./index.css";
import "mapbox-gl/dist/mapbox-gl.css";
import mapboxgl, { GeoJSONSource, Map } from "mapbox-gl";
import { createClient } from "@supabase/supabase-js";
import { useGeojson } from "./hooks/use-geojson";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseClient = createClient("http://localhost:54321", anonKey);

function App() {
	// const { geojson, setGeojson, initGeojson } = useGeojson(supabaseClient);

	const map = useRef<Map | null>(null);
	const [isGeolocating, setIsGeolocating] = useState<boolean>(false);
	const [range, setRange] = useState<number>(100);
	const [currentLoction, setcurrentLoction] = useState<GeoJSON.Point>();
	const [currentFeature, setcurrentFeature] =
		useState<mapboxgl.GeoJSONFeature | null>(null);
	const [show2025Trees, setShow2025Trees] = useState(true);
	const [show2024Trees, setShow2024Trees] = useState(true);
	// const [userAdoptions, setUserAdoptions] = useState<Adoption[]>([]);
	// const [userWaterings, setUserWaterings] = useState<Watering[]>([]);

	useEffect(() => {
		map.current = new mapboxgl.Map({
			container: "map",
			style: "mapbox://styles/mapbox/dark-v10",
			center: [13.404954, 52.520008],
			zoom: 10,
		});
		if (!map || !map.current) return;

		let selectedTreeId: string | null = null;

		map.current.on("load", async () => {
			// Add trees source and layer
			if (!map.current?.getSource("temp_trees")) {
				map.current!.addSource("temp_trees", {
					type: "vector",
					url: `mapbox://fmoronzirfas.gdk-trees-2025`,
				});
				map.current!.addLayer({
					id: "temp_trees",
					type: "circle",
					source: "temp_trees",
					"source-layer": "trees",
					paint: {
						"circle-pitch-alignment": "map",
						"circle-radius": 5,
						"circle-opacity": 0.3,
						"circle-stroke-color": "#000000",
						"circle-color": "#ff6347",
						"circle-stroke-width": 2,
					},
				});
			}

			if (!map.current?.getSource("trees")) {
				map.current!.addSource("trees", {
					type: "vector",
					url: `mapbox://fmoronzirfas.gdk-trees-2024`,
				});
				map.current!.addLayer({
					id: "trees",
					type: "circle",
					source: "trees",
					"source-layer": "trees",
					paint: {
						"circle-pitch-alignment": "map",
						"circle-radius": 5,
						"circle-opacity": 0.3,
						"circle-stroke-color": "#000000",
						"circle-color": "#00ff66",
						"circle-stroke-width": 2,
					},
				});
			}

			// Set initial visibility
			map.current!.setLayoutProperty(
				"temp_trees",
				"visibility",
				show2025Trees ? "visible" : "none",
			);
			map.current!.setLayoutProperty(
				"trees",
				"visibility",
				show2024Trees ? "visible" : "none",
			);

			// Add geolocate control
			const geolocate = new mapboxgl.GeolocateControl({
				positionOptions: {
					enableHighAccuracy: true,
				},
				trackUserLocation: true,
				showUserHeading: true,
			});
			map.current!.addControl(geolocate);
			geolocate.on("geolocate", function locateUser(e: any | undefined) {
				if (!e) return;
				console.log(e);
				setcurrentLoction({
					type: "Point",
					coordinates: [e.coords.longitude, e.coords.latitude],
				});
			});
			geolocate.on("trackuserlocationstart", () => {
				setIsGeolocating(true);
			});
			geolocate.on("trackuserlocationend", () => {
				setIsGeolocating(false);
				setcurrentLoction(undefined);
			});
		});

		map.current.on("click", "trees", function (e) {
			if (!e.features) return;
			const { features } = e;
			setcurrentFeature(features[0]);

			if (selectedTreeId) {
				map.current?.setFeatureState(
					{
						source: "trees",
						id: selectedTreeId,
					},
					{ selected: false },
				);
			}
			if (e.features[0].id) {
				selectedTreeId = e.features[0].id as string;

				map.current?.setFeatureState(
					{
						source: "trees",
						id: e.features[0].id,
					},
					{ selected: true },
				);
			}
		});

		return () => {
			if (map.current?.getLayer("temp_trees")) {
				map.current.removeLayer("temp_trees");
			}
			if (map.current?.getLayer("trees")) {
				map.current.removeLayer("trees");
			}
			if (map.current?.getSource("temp_trees")) {
				map.current.removeSource("temp_trees");
			}
			if (map.current?.getSource("trees")) {
				map.current.removeSource("trees");
			}
			map.current?.remove();
		};
	}, []);

	// Separate useEffect for visibility changes
	useEffect(() => {
		if (!map.current?.isStyleLoaded()) return;

		map.current.setLayoutProperty(
			"temp_trees",
			"visibility",
			show2025Trees ? "visible" : "none",
		);
		map.current.setLayoutProperty(
			"trees",
			"visibility",
			show2024Trees ? "visible" : "none",
		);
	}, [show2025Trees, show2024Trees]);

	return (
		<>
			<div className="controls">
				<label>
					<input
						type="checkbox"
						checked={show2025Trees}
						onChange={(e) => setShow2025Trees(e.target.checked)}
					/>
					2025 Trees
				</label>
				<label>
					<input
						type="checkbox"
						checked={show2024Trees}
						onChange={(e) => setShow2024Trees(e.target.checked)}
					/>
					2024 Trees
				</label>
			</div>
			<div id="map"></div>
		</>
	);
}

export default App;
