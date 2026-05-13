const mysql = require('mysql2/promise');
require('dotenv').config();

async function parcharFinalisimo() {
    const config = {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: 'expedientex',
        ssl: { rejectUnauthorized: false }
    };

    const conn = await mysql.createConnection(config);
    console.log("🛠️ PARCHEO FINALÍSIMO...");

    const getColumns = async (table) => {
        try {
            const [rows] = await conn.execute(`DESCRIBE \`${table}\``);
            return rows.map(r => r.Field);
        } catch (e) { return []; }
    };

    const addColumn = async (table, column, definition) => {
        const cols = await getColumns(table);
        if (!cols.includes(column)) {
            console.log(`➕ [${table}] -> ${column}`);
            await conn.execute(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
        }
    };

    try {
        await addColumn('noticias', 'autor', 'VARCHAR(255)');
        await addColumn('noticias', 'nivel_alerta', "VARCHAR(50) DEFAULT 'Bajo'");
        await addColumn('noticias', 'aprobado', 'INT DEFAULT 1');
        
        await addColumn('lugares', 'imagen_url', 'VARCHAR(255)');
        await addColumn('lugares', 'estado', "VARCHAR(50) DEFAULT 'pendiente'");

        console.log("✅ TODO LISTO.");
    } catch (err) {
        console.error("❌ ERROR:", err.message);
    } finally {
        await conn.end();
    }
}

parcharFinalisimo();
