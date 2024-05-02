import fs from "node:fs/promises";
/**
 * Check if a file exists at the given path using async/await.
 * @param {string} filePath - Path to the file.
 * @returns {Promise<boolean>} - Promise resolving to true if file exists, false otherwise.
 */
export async function fileExists(filePath: string) {
	try {
		await fs.stat(filePath);
		return true; // File does exist
	} catch (error) {
		if (error.code === "ENOENT") {
			return false; // File does not exist
		}
		throw error; // Rethrow unrecognized errors
	}
}

export function delay(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
