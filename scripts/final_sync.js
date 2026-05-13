const mysql = require('mysql2/promise');
require('dotenv').config();

async function syncAll() {
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
        console.log("🛠️ Sincronizando estructura y datos de archivos_usuarios...");
        
        // 1. Obtener schema de origen
        const [sourceCols] = await sourceConn.query("DESCRIBE archivos_usuarios");
        
        // 2. Recrear tabla en destino
        await targetConn.execute("DROP TABLE IF EXISTS archivos_usuarios");
        
        let createStmt = "CREATE TABLE archivos_usuarios (";
        const colDefs = sourceCols.map(c => {
            let def = `\`${c.Field}\` ${c.Type}`;
            if (c.Null === 'NO') def += " NOT NULL";
            if (c.Key === 'PRI') def += " PRIMARY KEY";
            if (c.Extra === 'auto_increment') def += " AUTO_INCREMENT";
            // Evitamos problemas de default con fechas
            if (c.Type.includes('timestamp') || c.Type.includes('datetime')) {
                // No ponemos default manual para evitar errores de version
            } else if (c.Default !== null) {
                def += ` DEFAULT '${c.Default}'`;
            }
            return def;
        });
        createStmt += colDefs.join(", ") + ")";
        
        await targetConn.execute(createStmt);
        console.log("  ✅ Estructura actualizada (sin defaults conflictivos).");

        // 3. Insertar datos
        const [rows] = await sourceConn.query("SELECT * FROM archivos_usuarios");
        for (const row of rows) {
            const columns = Object.keys(row);
            const placeholders = columns.map(() => '?').join(', ');
            const values = Object.values(row).map(v => {
                // Limpiar fechas inválidas si las hay
                if (v instanceof Date && isNaN(v.getTime())) return null;
                return v;
            });
            
            await targetConn.execute(`INSERT INTO archivos_usuarios (${columns.map(c => `\`${c}\``).join(', ')}) VALUES (${placeholders})`, values);
        }
        console.log(`  ✅ ${rows.length} archivos transferidos con éxito.`);

        // 4. Tablas extra
        const [sourceTables] = await sourceConn.query("SHOW TABLES");
        const [targetTables] = await targetConn.query("SHOW TABLES");
        const targetTableNames = targetTables.map(t => Object.values(t)[0]);

        for (const t of sourceTables) {
            const tableName = Object.values(t)[0];
            if (!targetTableNames.includes(tableName)) {
                console.log(`\n📦 Detectada tabla extra: ${tableName}.`);
                const [cols] = await sourceConn.query(`DESCRIBE \`${tableName}\``);
                let extraCreate = `CREATE TABLE \`${tableName}\` (`;
                const extraColDefs = cols.map(c => {
                    let def = `\`${c.Field}\` ${c.Type}`;
                    if (c.Null === 'NO') def += " NOT NULL";
                    if (c.Key === 'PRI') def += " PRIMARY KEY";
                    if (c.Extra === 'auto_increment') def += " AUTO_INCREMENT";
                    return def;
                });
                extraCreate += extraColDefs.join(", ") + ")";
                await targetConn.execute(extraCreate);

                const [extraRows] = await sourceConn.query(`SELECT * FROM \`${tableName}\``);
                for (const r of extraRows) {
                    const columns = Object.keys(r);
                    const placeholders = columns.map(() => '?').join(', ');
                    await targetConn.execute(`INSERT INTO \`${tableName}\` (${columns.map(c => `\`${c}\``).join(', ')}) VALUES (${placeholders})`, Object.values(r));
                }
                console.log(`  ✅ Tabla ${tableName} transferida.`);
            }
        }

    } catch (err) {
        console.error("❌ Error en syncAll:", err.message);
    } finally {
        await sourceConn.end();
        await targetConn.end();
    }
}

syncAll();
