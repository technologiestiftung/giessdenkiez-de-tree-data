import { useEffect, useRef, useState } from "react";
import "./index.css";
import "mapbox-gl/dist/mapbox-gl.css";
import mapboxgl, { Map } from "mapbox-gl";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

type Feature = GeoJSON.Feature<GeoJSON.LineString>;
type FeatureCollection = GeoJSON.FeatureCollection<GeoJSON.LineString>;

// Helper function to create point features from line endpoints
function createEndpointFeatures(
	lineFeatures: Feature[],
	isStart: boolean,
): GeoJSON.FeatureCollection {
	return {
		type: "FeatureCollection",
		features: lineFeatures.map((feature) => ({
			type: "Feature",
			properties: feature.properties,
			geometry: {
				type: "Point",
				coordinates: isStart
					? feature.geometry.coordinates[0]
					: feature.geometry.coordinates[
							feature.geometry.coordinates.length - 1
						],
			},
		})),
	};
}

// Constants for colors
const COLORS = {
	STREET: "#ff6347",
	ANLAGE: "#00ff66",
	START: "#000000",
	END: "#ffffff",
} as const;

function App() {
	const map = useRef<Map | null>(null);
	const [isGeolocating, setIsGeolocating] = useState<boolean>(false);
	const [currentLoction, setcurrentLoction] = useState<GeoJSON.Point>();
	const [currentFeature, setcurrentFeature] =
		useState<mapboxgl.GeoJSONFeature | null>(null);
	const [showStreetLines, setShowStreetLines] = useState(true);
	const [showAnlageLines, setShowAnlageLines] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!mapboxgl.accessToken) {
			setError("Mapbox token not found!");
			return;
		}

		map.current = new mapboxgl.Map({
			container: "map",
			style: "mapbox://styles/mapbox/dark-v10",
			center: [13.404954, 52.520008],
			zoom: 10,
		});
		if (!map || !map.current) return;

		map.current.on("load", async () => {
			try {
				console.log("Loading GeoJSON files...");
				// Load street lines
				const streetResponse = await fetch(
					"/dupes_gruen_street_line_converted.geojson",
				);
				if (!streetResponse.ok)
					throw new Error(
						`Failed to load street lines: ${streetResponse.statusText}`,
					);
				const streetData = await streetResponse.json();
				console.log(
					"Loaded street lines:",
					streetData.features?.length || 0,
					"features",
				);

				// Load anlage lines
				const anlageResponse = await fetch(
					"/dupes_gruen_anlage_line_converted.geojson",
				);
				if (!anlageResponse.ok)
					throw new Error(
						`Failed to load anlage lines: ${anlageResponse.statusText}`,
					);
				const anlageData = await anlageResponse.json();
				console.log(
					"Loaded anlage lines:",
					anlageData.features?.length || 0,
					"features",
				);

				if (!map.current) return;

				// Add sources for lines
				map.current.addSource("street_lines", {
					type: "geojson",
					data: streetData,
				});

				map.current.addSource("anlage_lines", {
					type: "geojson",
					data: anlageData,
				});

				// Add sources for start/end points
				map.current.addSource("street_starts", {
					type: "geojson",
					data: createEndpointFeatures(streetData.features, true),
				});

				map.current.addSource("street_ends", {
					type: "geojson",
					data: createEndpointFeatures(streetData.features, false),
				});

				map.current.addSource("anlage_starts", {
					type: "geojson",
					data: createEndpointFeatures(anlageData.features, true),
				});

				map.current.addSource("anlage_ends", {
					type: "geojson",
					data: createEndpointFeatures(anlageData.features, false),
				});

				// Add line layers
				map.current.addLayer({
					id: "street_lines",
					type: "line",
					source: "street_lines",
					paint: {
						"line-color": "#ff6347",
						"line-width": 2,
						"line-opacity": 0.8,
					},
				});

				map.current.addLayer({
					id: "anlage_lines",
					type: "line",
					source: "anlage_lines",
					paint: {
						"line-color": "#00ff66",
						"line-width": 2,
						"line-opacity": 0.8,
					},
				});

				// Add start point layers (black circles)
				map.current.addLayer({
					id: "street_starts",
					type: "circle",
					source: "street_starts",
					paint: {
						"circle-radius": 4,
						"circle-color": "#000000",
						"circle-stroke-width": 1,
						"circle-stroke-color": "#ffffff",
					},
				});

				map.current.addLayer({
					id: "anlage_starts",
					type: "circle",
					source: "anlage_starts",
					paint: {
						"circle-radius": 4,
						"circle-color": "#000000",
						"circle-stroke-width": 1,
						"circle-stroke-color": "#ffffff",
					},
				});

				// Add end point layers (white circles)
				map.current.addLayer({
					id: "street_ends",
					type: "circle",
					source: "street_ends",
					paint: {
						"circle-radius": 4,
						"circle-color": "#ffffff",
						"circle-stroke-width": 1,
						"circle-stroke-color": "#000000",
					},
				});

				map.current.addLayer({
					id: "anlage_ends",
					type: "circle",
					source: "anlage_ends",
					paint: {
						"circle-radius": 4,
						"circle-color": "#ffffff",
						"circle-stroke-width": 1,
						"circle-stroke-color": "#000000",
					},
				});

				// Set initial visibility
				const layers = [
					"street_lines",
					"street_starts",
					"street_ends",
					"anlage_lines",
					"anlage_starts",
					"anlage_ends",
				];
				layers.forEach((layer) => {
					map.current?.setLayoutProperty(
						layer,
						"visibility",
						layer.includes("street")
							? showStreetLines
								? "visible"
								: "none"
							: showAnlageLines
								? "visible"
								: "none",
					);
				});

				console.log("Map layers added successfully");

				// Add geolocate control
				const geolocate = new mapboxgl.GeolocateControl({
					positionOptions: {
						enableHighAccuracy: true,
					},
					trackUserLocation: true,
					showUserHeading: true,
				});
				map.current.addControl(geolocate);
				geolocate.on("geolocate", function locateUser(e: any | undefined) {
					if (!e) return;
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
			} catch (err) {
				console.error("Error loading GeoJSON:", err);
				setError(
					err instanceof Error ? err.message : "Failed to load map data",
				);
			}
		});

		map.current.on("click", ["street_lines", "anlage_lines"], function (e) {
			if (!e.features) return;
			const { features } = e;
			setcurrentFeature(features[0]);
		});

		return () => {
			const layers = [
				"street_lines",
				"street_starts",
				"street_ends",
				"anlage_lines",
				"anlage_starts",
				"anlage_ends",
			];
			const sources = [
				"street_lines",
				"street_starts",
				"street_ends",
				"anlage_lines",
				"anlage_starts",
				"anlage_ends",
			];

			layers.forEach((layer) => {
				if (map.current?.getLayer(layer)) {
					map.current.removeLayer(layer);
				}
			});

			sources.forEach((source) => {
				if (map.current?.getSource(source)) {
					map.current.removeSource(source);
				}
			});

			map.current?.remove();
		};
	}, []);

	// Separate useEffect for visibility changes
	useEffect(() => {
		if (!map.current?.isStyleLoaded()) return;

		const streetLayers = ["street_lines", "street_starts", "street_ends"];
		const anlageLayers = ["anlage_lines", "anlage_starts", "anlage_ends"];

		streetLayers.forEach((layer) => {
			map.current?.setLayoutProperty(
				layer,
				"visibility",
				showStreetLines ? "visible" : "none",
			);
		});

		anlageLayers.forEach((layer) => {
			map.current?.setLayoutProperty(
				layer,
				"visibility",
				showAnlageLines ? "visible" : "none",
			);
		});
	}, [showStreetLines, showAnlageLines]);

	return (
		<>
			<div className="controls">
				<div className="legend">
					<h3>Legend</h3>
					<div className="legend-section">
						<h4>Lines</h4>
						<div className="legend-item">
							<span
								className="color-box"
								style={{ backgroundColor: COLORS.STREET }}
							></span>
							<label>
								<input
									type="checkbox"
									checked={showStreetLines}
									onChange={(e) => setShowStreetLines(e.target.checked)}
								/>
								Street Lines
							</label>
						</div>
						<div className="legend-item">
							<span
								className="color-box"
								style={{ backgroundColor: COLORS.ANLAGE }}
							></span>
							<label>
								<input
									type="checkbox"
									checked={showAnlageLines}
									onChange={(e) => setShowAnlageLines(e.target.checked)}
								/>
								Anlage Lines
							</label>
						</div>
					</div>
					<div className="legend-section">
						<h4>Endpoints</h4>
						<div className="legend-item">
							<span
								className="circle-box"
								style={{
									backgroundColor: COLORS.START,
									border: `1px solid ${COLORS.END}`,
								}}
							></span>
							<span>Start (Grün Berlin)</span>
						</div>
						<div className="legend-item">
							<span
								className="circle-box"
								style={{
									backgroundColor: COLORS.END,
									border: `1px solid ${COLORS.START}`,
								}}
							></span>
							<span>End (Street/Anlage Dataset)</span>
						</div>
					</div>
				</div>
			</div>
			<div id="map"></div>
			<style>{`
				.controls {
					position: absolute;
					top: 10px;
					right: 10px;
					background: white;
					padding: 10px;
					border-radius: 4px;
					box-shadow: 0 0 10px rgba(0,0,0,0.1);
					z-index: 1;
					min-width: 200px;
				}
				.legend {
					font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
				}
				.legend h3 {
					margin: 0 0 10px 0;
					font-size: 16px;
				}
				.legend h4 {
					margin: 10px 0 5px 0;
					font-size: 14px;
					color: #666;
				}
				.legend-section {
					margin-bottom: 15px;
				}
				.legend-item {
					display: flex;
					align-items: center;
					margin: 5px 0;
					gap: 8px;
				}
				.color-box {
					width: 20px;
					height: 3px;
					display: inline-block;
					margin-right: 5px;
				}
				.circle-box {
					width: 12px;
					height: 12px;
					display: inline-block;
					border-radius: 50%;
					margin-right: 5px;
				}
				label {
					display: flex;
					align-items: center;
					gap: 5px;
					cursor: pointer;
				}
				input[type="checkbox"] {
					margin: 0;
				}
			`}</style>
		</>
	);
}

export default App;
