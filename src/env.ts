const { PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE } = process.env;
if (!PGHOST) {
	throw new Error("PGHOST is not defined");
}

if (!PGPORT) {
	throw new Error("PGPORT is not defined");
}

if (!PGUSER) {
	throw new Error("PGUSER is not defined");
}

if (!PGPASSWORD) {
	throw new Error("PGPASSWORD is not defined");
}

if (!PGDATABASE) {
	throw new Error("PGDATABASE is not defined");
}

export { PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE };
