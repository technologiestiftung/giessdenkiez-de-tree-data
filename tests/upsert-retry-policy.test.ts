// ABOUTME: Tests retry policy for batched tree upserts.
// ABOUTME: Verifies serialization failures get more retries and longer backoff.

import test from "node:test";
import assert from "node:assert/strict";
import {
	getUpsertRetryDelayMs,
	getUpsertRetryLimit,
} from "../src/db/upsert-retry-policy.ts";

test("getUpsertRetryLimit keeps default retries for unknown errors", () => {
	assert.equal(getUpsertRetryLimit(new Error("boom")), 3);
});

test("getUpsertRetryLimit increases retries for serialization failures", () => {
	assert.equal(getUpsertRetryLimit({ code: "40001" }), 10);
});

test("getUpsertRetryDelayMs uses capped exponential backoff", () => {
	assert.equal(getUpsertRetryDelayMs(1), 1_000);
	assert.equal(getUpsertRetryDelayMs(2), 2_000);
	assert.equal(getUpsertRetryDelayMs(6), 30_000);
	assert.equal(getUpsertRetryDelayMs(10), 30_000);
});
