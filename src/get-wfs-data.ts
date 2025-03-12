import ora from "ora";
import { delay } from "./utils.ts";

// Should first check if output folder exists
// make the web request
// write to file

export async function getWfsData() {
	const spinner = ora("Getting WFS data (not yet implemented)").start();
	delay(2000);
	spinner.text = "Getting WFS data";
	spinner.succeed("WFS data retrieved");
}
