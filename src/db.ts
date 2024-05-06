import postgres from "postgres";

interface DatabaseConfig {
	host: string;
	port: number;
	database: string;
	username: string;
	password: string;
}

export function createDatabeConnection({
	host,
	port,
	database,
	username,
	password,
}: DatabaseConfig) {
	const sql = postgres({
		host,
		port,
		database,
		username,
		password,
	});

	return sql;
}
