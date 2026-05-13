const mysql = require('mysql2/promise');
require('dotenv').config();

async function inspect() {
    const commonConfig = {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        ssl: { rejectUnauthorized: false }
    };

    const dbs = ['expedientex', 'expedientex_bunker'];

    for (const dbName of dbs) {
        console.log(`\n🔍 Schema de ${dbName}.archivos_usuarios:`);
        const conn = await mysql.createConnection({ ...commonConfig, database: dbName });
        try {
            const [columns] = await conn.query(`DESCRIBE archivos_usuarios`);
            console.table(columns.map(c => ({ Campo: c.Field, Tipo: c.Type })));
        } catch (e) {
            console.error(`  ❌ Error: ${e.message}`);
        }
        await conn.end();
    }
}

inspect();
