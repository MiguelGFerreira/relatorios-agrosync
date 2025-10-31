import sql, { config as SqlConfig, ConnectionPool } from 'mssql';

const dbConfig: SqlConfig = {
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
	server: process.env.DB_SERVER!,
	database: process.env.DB_DATABASE,
	port: parseInt(process.env.DB_PORT || "1433"),
	options: {
		debug: {
			token: true,
			packet: true,
			data: true,
			payload: true
		},
		encrypt: process.env.DB_ENCRYPT === 'true',
		trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
	},
	pool: {
		max: 10,
		min: 0,
		idleTimeoutMillis: 30000,
	},
};

let pool: ConnectionPool | null = null;

export async function connectToDatabase() {
	try {
		if (!pool || !pool.connected) {
			pool = await sql.connect(dbConfig);
		}
		return pool;
	} catch (err) {
		console.error('Falha na conexão com o banco de dados:', err);
		// erro para ser tratado na API route
		throw new Error('Não foi possível conectar ao banco de dados.');
	}
}

export const dbQuery = async (queryString: string) => {
	const pool = await connectToDatabase();
	const result = await pool.request().query(queryString);
	return result.recordset;
}