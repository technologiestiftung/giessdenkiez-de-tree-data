// ABOUTME: Formats progress output for batched database operations.
// ABOUTME: Calculates elapsed time, average batch duration, ETA, and timestamps.

export type BatchStartProgress = {
	operation?: string;
	batchNumber: number;
	totalBatches: number;
	currentCount: number;
	endCount: number;
	totalItems: number;
	completedBatches: number;
	startTimeMs: number;
	nowMs: number;
};

export type BatchCompletionProgress = {
	affectedCount: number;
	processedCount: number;
	totalItems: number;
	batchDurationMs: number;
	nowMs: number;
};

function formatTimestamp(ms: number): string {
	return new Date(ms).toISOString();
}

export function formatDuration(milliseconds: number): string {
	const totalSeconds = Math.max(0, Math.round(milliseconds / 1000));
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;

	if (hours > 0) {
		return `${hours}h ${minutes}m ${seconds}s`;
	}

	if (minutes > 0) {
		return `${minutes}m ${seconds}s`;
	}

	return `${seconds}s`;
}

export function formatBatchStartMessage(progress: BatchStartProgress): string {
	const percentage = Math.round((progress.endCount / progress.totalItems) * 100);
	const elapsedMs = progress.nowMs - progress.startTimeMs;
	const operation = progress.operation ?? "Batch";
	const prefix = `[${formatTimestamp(progress.nowMs)}] ${operation} ${progress.batchNumber}/${progress.totalBatches}: ${progress.currentCount}-${progress.endCount}/${progress.totalItems} (${percentage}%)`;

	if (progress.completedBatches === 0) {
		return `${prefix} | elapsed ${formatDuration(elapsedMs)} | ETA calculating after first batch`;
	}

	const averageBatchMs = elapsedMs / progress.completedBatches;
	const remainingBatches = progress.totalBatches - progress.completedBatches;
	const etaMs = averageBatchMs * remainingBatches;
	const doneAtMs = progress.nowMs + etaMs;

	return `${prefix} | elapsed ${formatDuration(elapsedMs)} | avg/batch ${formatDuration(averageBatchMs)} | ETA ${formatDuration(etaMs)} | done around ${formatTimestamp(doneAtMs)}`;
}

export function formatBatchCompletionMessage(
	progress: BatchCompletionProgress,
): string {
	const progressPercent = Math.round(
		(progress.processedCount / progress.totalItems) * 100,
	);

	return `[${formatTimestamp(progress.nowMs)}]   ✓ Affected rows: ${progress.affectedCount} (Total: ${progress.processedCount}/${progress.totalItems} - ${progressPercent}%, batch duration ${formatDuration(progress.batchDurationMs)})`;
}
