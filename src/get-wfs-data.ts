import ora from "ora";
import { delay } from "./utils.js";

// Should first check if output folder exists
// make the web request
// write to file

export async function getWfsData() {
	const spinner = ora("Getting WFS data").start();
	delay(2000);
	spinner.text = "Getting WFS data";
	spinner.succeed("WFS data retrieved");
}
