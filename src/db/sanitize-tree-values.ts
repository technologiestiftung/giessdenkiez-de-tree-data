// ABOUTME: Sanitizes imported tree values before inserting them into temp tables.
// ABOUTME: Applies type/range checks to avoid invalid int4 year values from source GeoJSON.

const PG_INT4_MIN = -2147483648;
const PG_INT4_MAX = 2147483647;

function toFiniteNumber(value: unknown): number | null {
	if (typeof value === "number") {
		return Number.isFinite(value) ? value : null;
	}

	if (typeof value !== "string") {
		return null;
	}

	const trimmed = value.trim();
	if (!trimmed) {
		return null;
	}

	if (!/^-?\d+(\.\d+)?([eE][-+]?\d+)?$/.test(trimmed)) {
		return null;
	}

	const parsed = Number(trimmed);
	return Number.isFinite(parsed) ? parsed : null;
}

export function sanitizePflanzjahr(value: unknown): number | null {
	const parsed = toFiniteNumber(value);
	if (parsed === null) {
		return null;
	}

	if (!Number.isInteger(parsed) || !Number.isSafeInteger(parsed)) {
		return null;
	}

	if (parsed < PG_INT4_MIN || parsed > PG_INT4_MAX) {
		return null;
	}

	return parsed;
}
