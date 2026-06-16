const mysql = require('mysql2/promise');

const localConfig = {
    host: '127.0.0.1',
    port: 3307,
    user: 'root',
    password: '',
    database: 'egipto_db'
};

const remoteConfig = {
    host: 'mysql-1cd66845-pepemoji66-a012.c.aivencloud.com',
    port: 11475,
    user: 'avnadmin',
    password: 'AVNS_f1PJAUD3s5YOIS98BUr',
    database: 'egipto_db',
    ssl: { rejectUnauthorized: false }
};

const tables = [
    'audios',
    'chat_messages',
    'contenido_inicio',
    'imagenes',
    'monumentos_360',
    'noticias',
    'usuarios',
    'videos'
];

async function migrate() {
    let localConn, remoteConn;
    try {
        console.log("📡 Conectando a base de datos local (XAMPP 3307)...");
        localConn = await mysql.createConnection(localConfig);
        console.log("✅ Conectado a local.");

        console.log("📡 Conectando a Aiven MySQL remoto...");
        remoteConn = await mysql.createConnection(remoteConfig);
        console.log("✅ Conectado a Aiven.");

        for (const table of tables) {
            console.log(`\n📦 Migrando tabla: ${table}...`);
            
            // Check if the table exists locally before querying
            try {
                // 1. Obtener datos locales
                const [rows] = await localConn.query(`SELECT * FROM \`${table}\``);
                console.log(`   Encontradas ${rows.length} filas en local.`);

                if (rows.length === 0) {
                    console.log(`   Saltando tabla ${table} (sin datos).`);
                    continue;
                }

                // 2. Limpiar tabla remota para evitar conflictos
                await remoteConn.query(`DELETE FROM \`${table}\``);
                console.log(`   Tabla remota ${table} limpiada.`);

                // 3. Obtener nombres de columnas
                const columns = Object.keys(rows[0]);
                const placeholders = columns.map(() => '?').join(', ');
                const insertSql = `INSERT INTO \`${table}\` (${columns.map(c => `\`${c}\``).join(', ')}) VALUES (${placeholders})`;

                // 4. Insertar datos en remoto
                for (const row of rows) {
                    const values = columns.map(col => row[col]);
                    await remoteConn.query(insertSql, values);
                }
                console.log(`   ✅ Migradas ${rows.length} filas a Aiven.`);
            } catch (err) {
                console.warn(`   ⚠️ La tabla ${table} falló o no existe:`, err.message);
            }
        }

        console.log("\n🎉 ¡MIGRACIÓN COMPLETADA CON ÉXITO!");
    } catch (error) {
        console.error("❌ ERROR CRÍTICO durante la migración:", error);
    } finally {
        if (localConn) await localConn.end();
        if (remoteConn) await remoteConn.end();
    }
}

migrate();
