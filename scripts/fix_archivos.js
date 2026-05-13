const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixArchivos() {
    const commonConfig = {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        ssl: { rejectUnauthorized: false }
    };

    const sourceDbName = 'expedientex';
    const targetDbName = 'expedientex_bunker';

    const sourceConn = await mysql.createConnection({ ...commonConfig, database: sourceDbName });
    const targetConn = await mysql.createConnection({ ...commonConfig, database: targetDbName });

    try {
        console.log("🛠️ Corrigiendo unificación de archivos_usuarios...");
        
        const [sourceRows] = await sourceConn.query("SELECT * FROM archivos_usuarios");
        console.log(`  - Encontrados ${sourceRows.length} archivos en origen.`);

        for (const row of sourceRows) {
            // Verificamos qué columnas tiene realmente
            const columns = Object.keys(row).filter(key => key !== 'id');
            const placeholders = columns.map(() => '?').join(', ');
            const values = columns.map(col => row[col]);

            // Comprobar si ya existe por nombre_archivo
            const [check] = await targetConn.query("SELECT 1 FROM archivos_usuarios WHERE nombre_archivo = ?", [row.nombre_archivo]);
            
            if (check.length === 0) {
                await targetConn.execute(`INSERT INTO archivos_usuarios (${columns.map(c => `\`${c}\``).join(', ')}) VALUES (${placeholders})`, values);
                console.log(`  ✅ Insertado: ${row.nombre_archivo}`);
            } else {
                console.log(`  ⏩ Omitido (ya existe): ${row.nombre_archivo}`);
            }
        }
    } catch (err) {
        console.error("❌ Error en fixArchivos:", err.message);
    } finally {
        await sourceConn.end();
        await targetConn.end();
    }
}

fixArchivos();
