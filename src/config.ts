export const defaultConfig = {
	"temp-trees-table": "temp_trees",
	"dry-run": false,
};

let userConfig: Partial<typeof defaultConfig> = {};

export function setUserConfig(conf: Partial<typeof defaultConfig>) {
	userConfig = conf;
}

function mergeConfig(conf: Partial<typeof defaultConfig>) {
	return { ...defaultConfig, ...conf };
}

export function config() {
	return mergeConfig(userConfig);
}
