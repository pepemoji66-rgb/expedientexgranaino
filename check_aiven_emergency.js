const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkOldDb() {
    const config = {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        ssl: { rejectUnauthorized: false }
    };

    const dbs = ['expedientex', 'expedientex_bunker'];

    for (const dbName of dbs) {
        console.log(`\n🔍 BUSCANDO EN ${dbName}...`);
        const db = await mysql.createConnection({ ...config, database: dbName });
        
        try {
            const [noticias] = await db.query("SELECT * FROM noticias WHERE cuerpo LIKE '%Sierra%' OR titulo LIKE '%Sierra%' OR cuerpo LIKE '%EVA 9%' OR cuerpo LIKE '%Conjuro%' OR cuerpo LIKE '%hola%'");
            if (noticias.length > 0) {
                console.log(`✅ ¡ENCONTRADO EN ${dbName}.noticias!`);
                console.log(JSON.stringify(noticias, null, 2));
            }

            const [exp] = await db.query("SELECT * FROM expedientes WHERE contenido LIKE '%Sierra%' OR titulo LIKE '%Sierra%' OR contenido LIKE '%EVA 9%' OR contenido LIKE '%Conjuro%' OR contenido LIKE '%hola%'");
            if (exp.length > 0) {
                console.log(`✅ ¡ENCONTRADO EN ${dbName}.expedientes!`);
                console.log(JSON.stringify(exp, null, 2));
            }
        } catch (e) {
            console.error(`❌ Error en ${dbName}:`, e.message);
        }
        await db.end();
    }
}

checkOldDb();
