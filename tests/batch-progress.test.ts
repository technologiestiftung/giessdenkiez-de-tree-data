// ABOUTME: Tests progress message formatting for batched database operations.
// ABOUTME: Verifies timestamps, elapsed time, batch duration, and ETA output.

import test from "node:test";
import assert from "node:assert/strict";
import {
	formatBatchCompletionMessage,
	formatBatchStartMessage,
	formatDuration,
} from "../src/db/batch-progress.ts";

test("formatDuration renders compact durations", () => {
	assert.equal(formatDuration(0), "0s");
	assert.equal(formatDuration(1_500), "2s");
	assert.equal(formatDuration(65_000), "1m 5s");
	assert.equal(formatDuration(3_665_000), "1h 1m 5s");
});

test("formatBatchStartMessage shows timestamp and waits for ETA data", () => {
	const message = formatBatchStartMessage({
		operation: "Batch",
		batchNumber: 1,
		totalBatches: 5,
		currentCount: 1,
		endCount: 500,
		totalItems: 2_500,
		completedBatches: 0,
		startTimeMs: 0,
		nowMs: 0,
	});

	assert.match(message, /^\[1970-01-01T00:00:00\.000Z\] Batch 1\/5:/);
	assert.match(message, /500\/2500 \(20%\)/);
	assert.match(message, /ETA calculating after first batch/);
});

test("formatBatchStartMessage estimates remaining time from completed batches", () => {
	const message = formatBatchStartMessage({
		operation: "Batch",
		batchNumber: 3,
		totalBatches: 5,
		currentCount: 1_001,
		endCount: 1_500,
		totalItems: 2_500,
		completedBatches: 2,
		startTimeMs: 0,
		nowMs: 120_000,
	});

	assert.match(message, /elapsed 2m 0s/);
	assert.match(message, /avg\/batch 1m 0s/);
	assert.match(message, /ETA 3m 0s/);
	assert.match(message, /done around 1970-01-01T00:05:00\.000Z/);
});

test("formatBatchCompletionMessage includes timestamp and batch duration", () => {
	const message = formatBatchCompletionMessage({
		affectedCount: 500,
		processedCount: 1_000,
		totalItems: 2_500,
		batchDurationMs: 12_000,
		nowMs: 24_000,
	});

	assert.match(message, /^\[1970-01-01T00:00:24\.000Z\]/);
	assert.match(message, /Affected rows: 500/);
	assert.match(message, /batch duration 12s/);
	assert.match(message, /40%/);
});
