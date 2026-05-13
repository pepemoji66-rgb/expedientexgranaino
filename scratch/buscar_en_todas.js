const mysql = require('mysql2/promise');
require('dotenv').config();

async function buscarEnTodasBases() {
    const dbs = ['expedientex_bunker', 'expedientex'];
    
    for (const dbName of dbs) {
        console.log(`\n🔍 BUSCANDO EN DATABASE: [${dbName}]...`);
        let conn;
        try {
            conn = await mysql.createConnection({
                host: process.env.DB_HOST,
                port: process.env.DB_PORT,
                user: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
                database: dbName,
                ssl: { rejectUnauthorized: false }
            });

            const [rows] = await conn.execute(
                "SELECT * FROM expedientes WHERE titulo LIKE '%ERA%' OR contenido LIKE '%ERA%' OR titulo LIKE '%COSECHA%' OR contenido LIKE '%COSECHA%' OR titulo LIKE '%VISITA%' OR contenido LIKE '%VISITA%'"
            );

            if (rows.length > 0) {
                console.log(`✅ SE HAN ENCONTRADO ${rows.length} COINCIDENCIAS EN ${dbName}:`);
                rows.forEach(row => {
                    console.log("-----------------------------------------");
                    console.log(`ID: ${row.id}`);
                    console.log(`TÍTULO: ${row.titulo}`);
                    console.log(`CONTENIDO (fragmento): ${row.contenido.substring(0, 100)}...`);
                });
            } else {
                console.log(`❌ NO SE ENCONTRÓ NADA EN ${dbName}.`);
            }
        } catch (err) {
            console.error(`❌ ERROR CONECTANDO A ${dbName}:`, err.message);
        } finally {
            if (conn) await conn.end();
        }
    }
    process.exit(0);
}

buscarEnTodasBases();
