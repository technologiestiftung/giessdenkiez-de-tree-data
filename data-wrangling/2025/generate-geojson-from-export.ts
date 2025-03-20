import { parseArgs, styleText } from "node:util";

import { readFile, writeFile } from 'fs/promises';
import path from 'path';

interface Geometry {
  type: string;
  coordinates: number[][] | number[][][];
}

interface InputFeature {
  geometry: Geometry;
  [key: string]: any;
}

interface GeoJSONFeature {
  type: "Feature";
  geometry: Geometry;
  properties: { [key: string]: any };
}

interface GeoJSON {
  type: "FeatureCollection";
  features: GeoJSONFeature[];
}

function convertToGeoJSON(input: InputFeature | InputFeature[]): GeoJSON {
  const features = Array.isArray(input) ? input : [input];

  return {
    type: "FeatureCollection",
    features: features.map(feature => ({
      type: "Feature",
      geometry: feature.geometry,
      properties: Object.fromEntries(
        Object.entries(feature).filter(([key]) => key !== "geometry")
      )
    }))
  };
}

async function main() {
  try {
    const { values } = parseArgs({
      options: {
        input: { type: "string", short: "i", required: true },
        help: { type: "boolean", short: "h" }
      }
    });

    if (values.help) {
      console.log(`
Usage: convert-geojson --input <file>
Options:
  -i, --input    Input JSON file path
  -h, --help     Show this help message
      `);
      process.exit(0);
    }

    const inputFile = values.input;
		if(!inputFile){
			console.error(styleText("red","No input provided"))
			process.exit(1)
		}
    const outputFile = path.join(
      path.dirname(inputFile),
      `${path.basename(inputFile, '.json')}.geojson`
    );

    const data = JSON.parse(
      await readFile(inputFile, 'utf-8')
    );

    const geojson = convertToGeoJSON(data);

    await writeFile(outputFile, JSON.stringify(geojson, null, 2));
    console.log(`Successfully converted to ${outputFile}`);

  } catch (error) {
    if (error instanceof Error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  }
}

main();