// ABOUTME: Writes a text report for GeoJSON import abnormalities.
// ABOUTME: Captures invalid values and missing IDs with source file metadata.

import { mkdir } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import path from "node:path";
import { once } from "node:events";
import type { TreeType } from "../common.ts";

export type ImportReportContext = {
	sourceFilePath: string;
	treeType: TreeType | undefined;
	totalFeatures: number;
};

type ReportOptions = {
	outputDir?: string;
};

type IdContext = {
	index: number;
	pitid?: string | null;
	gisid?: string | null;
};

type InvalidPflanzjahr = IdContext & {
	value: unknown;
};

type SuspiciousPflanzjahr = InvalidPflanzjahr & {
	reason: string;
};

type SuspiciousStandalter = IdContext & {
	value: unknown;
	reason: string;
};

function formatTimestamp(date: Date): string {
	const yyyy = `${date.getFullYear()}`;
	const mm = `${date.getMonth() + 1}`.padStart(2, "0");
	const dd = `${date.getDate()}`.padStart(2, "0");
	const hh = `${date.getHours()}`.padStart(2, "0");
	const min = `${date.getMinutes()}`.padStart(2, "0");
	const sec = `${date.getSeconds()}`.padStart(2, "0");
	const ms = `${date.getMilliseconds()}`.padStart(3, "0");
	return `${yyyy}${mm}${dd}-${hh}${min}${sec}-${ms}`;
}

function textValue(value: unknown): string {
	if (value === null || value === undefined) {
		return "<null>";
	}
	if (typeof value === "string") {
		return value;
	}
	return JSON.stringify(value);
}

export async function createImportReport(
	context: ImportReportContext,
	options: ReportOptions = {},
) {
	const outputDir = options.outputDir ?? process.cwd();
	await mkdir(outputDir, { recursive: true });

	const filename = `import-report-${formatTimestamp(new Date())}.txt`;
	const reportPath = path.join(outputDir, filename);
	const stream = createWriteStream(reportPath, { encoding: "utf8" });

	const counters = {
		invalidPflanzjahr: 0,
		suspiciousPflanzjahr: 0,
		suspiciousStandalter: 0,
		missingGmlId: 0,
	};

	const writeLine = (line: string) => {
		stream.write(`${line}\n`);
	};

	writeLine("GeoJSON import report");
	writeLine(`Created at: ${new Date().toISOString()}`);
	writeLine(`Source file: ${context.sourceFilePath}`);
	writeLine(`Tree type: ${context.treeType ?? "<not-set>"}`);
	writeLine(`Total features: ${context.totalFeatures}`);
	writeLine("");
	writeLine("Abnormalities");

	const formatIdContext = (payload: IdContext) =>
		`feature=${payload.index + 1} pitid=${payload.pitid ?? "<null>"} gisid=${payload.gisid ?? "<null>"}`;

	return {
		reportPath,
		recordInvalidPflanzjahr(payload: InvalidPflanzjahr) {
			counters.invalidPflanzjahr++;
			writeLine(
				`[invalid_pflanzjahr] ${formatIdContext(payload)} value=${textValue(payload.value)}`,
			);
		},
		recordSuspiciousPflanzjahr(payload: SuspiciousPflanzjahr) {
			counters.suspiciousPflanzjahr++;
			writeLine(
				`[suspicious_pflanzjahr] ${formatIdContext(payload)} value=${textValue(payload.value)} reason=${payload.reason}`,
			);
		},
		recordSuspiciousStandalter(payload: SuspiciousStandalter) {
			counters.suspiciousStandalter++;
			writeLine(
				`[suspicious_standalter] ${formatIdContext(payload)} value=${textValue(payload.value)} reason=${payload.reason}`,
			);
		},
		recordMissingGmlId(_payload: IdContext) {
			counters.missingGmlId++;
		},
		async finalize() {
			writeLine("");
			writeLine("Summary");
			writeLine(`Invalid pflanzjahr: ${counters.invalidPflanzjahr}`);
			writeLine(`Suspicious pflanzjahr: ${counters.suspiciousPflanzjahr}`);
			writeLine(`Suspicious standalter: ${counters.suspiciousStandalter}`);
			writeLine(`Missing gml_id: ${counters.missingGmlId}`);
			stream.end();
			await once(stream, "finish");
			return reportPath;
		},
	};
}
