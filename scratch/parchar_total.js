const mysql = require('mysql2/promise');
require('dotenv').config();

async function parcharTotalmente() {
    const config = {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: 'expedientex',
        ssl: { rejectUnauthorized: false }
    };

    const conn = await mysql.createConnection(config);
    console.log("🛠️ PARCHEO TOTAL DE ESTRUCTURA...");

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
        // Noticias
        await addColumn('noticias', 'categoria', 'VARCHAR(100)');
        await addColumn('noticias', 'nivel_alerta', "VARCHAR(50) DEFAULT 'Bajo'");
        await addColumn('noticias', 'ubicacion', 'VARCHAR(255)');
        
        // Usuarios
        await addColumn('usuarios', 'rol', "VARCHAR(50) DEFAULT 'agente'");
        
        // Lugares
        await addColumn('lugares', 'ubicacion', 'VARCHAR(255)');

        console.log("✅ ESTRUCTURA TOTALMENTE SINCRONIZADA.");
    } catch (err) {
        console.error("❌ ERROR:", err.message);
    } finally {
        await conn.end();
    }
}

parcharTotalmente();
