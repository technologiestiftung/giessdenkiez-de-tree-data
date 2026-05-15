// ABOUTME: Tests value sanitization used during GeoJSON import.
// ABOUTME: Verifies invalid year values are converted to NULL-safe values.

import test from "node:test";
import assert from "node:assert/strict";
import { sanitizePflanzjahr } from "../src/db/sanitize-tree-values.ts";

test("sanitizePflanzjahr accepts valid int4 integers", () => {
	assert.equal(sanitizePflanzjahr("1991"), 1991);
	assert.equal(sanitizePflanzjahr(2025), 2025);
});

test("sanitizePflanzjahr rejects malformed or out-of-int4 values", () => {
	assert.equal(sanitizePflanzjahr("19853333314434713336"), null);
	assert.equal(sanitizePflanzjahr("abc"), null);
	assert.equal(sanitizePflanzjahr(""), null);
	assert.equal(sanitizePflanzjahr(2147483648), null);
	assert.equal(sanitizePflanzjahr(-2147483649), null);
});
