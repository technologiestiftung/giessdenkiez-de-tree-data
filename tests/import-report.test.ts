// ABOUTME: Tests generation of import report files for GeoJSON imports.
// ABOUTME: Verifies report includes source path and recorded abnormalities.

import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import {
	createImportReport,
	type ImportReportContext,
} from "../src/db/import-report.ts";

function createContext(overrides: Partial<ImportReportContext> = {}): ImportReportContext {
	return {
		sourceFilePath: "/tmp/input/strasse.geo.json",
		totalFeatures: 3,
		treeType: "strasse",
		...overrides,
	};
}

test("creates report file with source path and summary", async () => {
	const outputDir = await mkdtemp(path.join(tmpdir(), "import-report-"));
	const report = await createImportReport(createContext(), { outputDir });

	report.recordInvalidPflanzjahr({
		index: 1,
		value: "19853333314434713336",
		pitid: "00008100:001afb2b",
		gisid: "00008100_001afb2b",
	});
	report.recordMissingGmlId({
		index: 1,
		pitid: "00008100:001afb2b",
		gisid: "00008100_001afb2b",
	});

	const reportPath = await report.finalize();
	const content = await readFile(reportPath, "utf8");

	assert.match(path.basename(reportPath), /^import-report-\d{8}-\d{6}-\d{3}\.txt$/);
	assert.match(content, /Source file: \/tmp\/input\/strasse\.geo\.json/);
	assert.match(content, /Invalid pflanzjahr: 1/);
	assert.match(content, /Missing gml_id: 1/);
	assert.match(content, /19853333314434713336/);
	assert.doesNotMatch(content, /\[missing_gml_id\]/);
});
