// ABOUTME: Defines retry behavior for batched tree upserts.
// ABOUTME: Gives serialization failures more attempts with capped exponential backoff.

const DEFAULT_RETRY_LIMIT = 3;
const SERIALIZATION_FAILURE_RETRY_LIMIT = 10;
const RETRY_BASE_DELAY_MS = 1_000;
const RETRY_MAX_DELAY_MS = 30_000;
const POSTGRES_SERIALIZATION_FAILURE = "40001";

function getErrorCode(error: unknown): string | undefined {
	if (typeof error !== "object" || error === null || !("code" in error)) {
		return undefined;
	}

	const code = error.code;
	return typeof code === "string" ? code : undefined;
}

export function getUpsertRetryLimit(error: unknown): number {
	if (getErrorCode(error) === POSTGRES_SERIALIZATION_FAILURE) {
		return SERIALIZATION_FAILURE_RETRY_LIMIT;
	}

	return DEFAULT_RETRY_LIMIT;
}

export function getUpsertRetryDelayMs(retryNumber: number): number {
	const exponentialDelay = RETRY_BASE_DELAY_MS * Math.pow(2, retryNumber - 1);
	return Math.min(exponentialDelay, RETRY_MAX_DELAY_MS);
}
