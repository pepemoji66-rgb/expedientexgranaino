const mysql = require('mysql2/promise');
require('dotenv').config();

async function parcharTodo() {
    const config = {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: 'expedientex',
        ssl: { rejectUnauthorized: false }
    };

    const conn = await mysql.createConnection(config);
    console.log("🛠️ ESCANEANDO TODOS LOS SECTORES PARA ASEGURAR COMPATIBILIDAD...");

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
        // Videos
        await addColumn('videos', 'latitud', 'DOUBLE DEFAULT 0');
        await addColumn('videos', 'longitud', 'DOUBLE DEFAULT 0');
        await addColumn('videos', 'capturas', 'TEXT');
        
        // Imagenes
        await addColumn('imagenes', 'latitud', 'DOUBLE DEFAULT 0');
        await addColumn('imagenes', 'longitud', 'DOUBLE DEFAULT 0');
        await addColumn('imagenes', 'es_atarfe', 'INT DEFAULT 0');
        
        // Noticias
        await addColumn('noticias', 'latitud', 'DOUBLE');
        await addColumn('noticias', 'longitud', 'DOUBLE');
        await addColumn('noticias', 'fuente_url', 'TEXT');
        await addColumn('noticias', 'agente', 'VARCHAR(255)');
        
        // Audios
        await addColumn('audios', 'imagen_url', 'VARCHAR(255)');
        
        // Expedientes
        await addColumn('expedientes', 'imagen_url', 'VARCHAR(255)');

        console.log("✅ TODOS LOS SECTORES ESTÁN LISTOS PARA LA FUSIÓN.");
    } catch (err) {
        console.error("❌ ERROR EN EL ESCANEO:", err.message);
    } finally {
        await conn.end();
    }
}

parcharTodo();
