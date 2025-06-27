import postgres from "postgres";

export async function doesTableExist(
	sql: postgres.Sql,
	tableName: string,
	schemaName = "public",
): Promise<boolean> {
	try {
		const result = await sql`
		SELECT EXISTS (
			SELECT FROM information_schema.tables
			WHERE  table_schema = ${schemaName}
			AND    table_name   = ${tableName}
	 );
	 `;

		if (result && result.length === 1 && result[0].exists) {
			// console.info(
			// 	`Table "${tableName}" in schema "${schemaName}" already exists`,
			// );
			return true;
		}
		return false;
	} catch (error: unknown) {
		if (error instanceof Error) {
			console.error(error.message);
			return false;
		}
		console.error(error);

		return false;
	}
}

export async function testConnection(sql: postgres.Sql) {
	const result = await sql`SELECT version()`;
	return result[0].version;
}
