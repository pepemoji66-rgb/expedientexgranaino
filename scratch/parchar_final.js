const mysql = require('mysql2/promise');
require('dotenv').config();

async function parcharFinal() {
    const config = {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: 'expedientex',
        ssl: { rejectUnauthorized: false }
    };

    const conn = await mysql.createConnection(config);
    console.log("🛠️ PARCHEO FINAL DE EMERGENCIA...");

    const getColumns = async (table) => {
        try {
            const [rows] = await conn.execute(`DESCRIBE \`${table}\``);
            return rows.map(r => r.Field);
        } catch (e) { return []; }
    };

    const addColumn = async (table, column, definition) => {
        const cols = await getColumns(table);
        if (!cols.includes(column)) {
            console.log(`➕ [${table}] -> Añadiendo ${column}...`);
            await conn.execute(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
        }
    };

    try {
        await addColumn('expedientes', 'latitud', 'DOUBLE DEFAULT 0');
        await addColumn('expedientes', 'longitud', 'DOUBLE DEFAULT 0');
        await addColumn('expedientes', 'tipo', 'VARCHAR(50) DEFAULT \"agente\"');
        await addColumn('expedientes', 'estado', 'VARCHAR(50) DEFAULT \"pendiente\"');
        
        await addColumn('noticias', 'latitud', 'DOUBLE');
        await addColumn('noticias', 'longitud', 'DOUBLE');
        
        await addColumn('lugares', 'latitud', 'DOUBLE');
        await addColumn('lugares', 'longitud', 'DOUBLE');

        console.log("✅ PARCHEO FINAL COMPLETADO.");
    } catch (err) {
        console.error("❌ ERROR:", err.message);
    } finally {
        await conn.end();
    }
}

parcharFinal();
