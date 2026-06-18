const mysql = require('mysql2/promise');
require('dotenv').config();

async function unificarBases() {
    console.log("🛠️ INICIANDO PROTOCOLO DE UNIFICACIÓN: [expedientex_bunker] -> [expedientex]");
    
    const config = {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        ssl: { rejectUnauthorized: false }
    };

    let connSource, connDest;

    try {
        connSource = await mysql.createConnection({ ...config, database: 'expedientex_bunker' });
        connDest = await mysql.createConnection({ ...config, database: 'expedientex' });

        // Listado de tablas a migrar
        const tables = [
            'usuarios', 'videos', 'imagenes', 'expedientes', 
            'chat_mensajes', 'noticias', 'lugares', 'audios', 
            'archivos_usuarios', 'horoscopos', 'comentarios', 'visitas'
        ];

        for (const table of tables) {
            if (table === 'visitas') continue; // Manejo especial abajo
            console.log(`\n📦 Procesando tabla: [${table}]...`);
            
            let rows;
            try {
                [rows] = await connSource.execute(`SELECT * FROM ${table}`);
            } catch (e) {
                console.log(`⚠️ La tabla ${table} no existe en el origen. Saltando.`);
                continue;
            }

            if (rows.length === 0) {
                console.log(`ℹ️ Tabla ${table} vacía en el origen.`);
                continue;
            }

            console.log(`📥 Migrando ${rows.length} registros...`);

            for (const row of rows) {
                const keys = Object.keys(row);
                const values = Object.values(row);
                const columns = keys.map(k => `\`${k}\``).join(', ');
                const placeholders = keys.map(() => '?').join(', ');
                
                const sql = `INSERT IGNORE INTO \`${table}\` (${columns}) VALUES (${placeholders})`;
                await connDest.execute(sql, values);
            }
            console.log(`✅ Tabla [${table}] unificada.`);
        }

        // Manejo especial de Visitas: Mantener la cuenta más alta
        console.log("\n🔢 Sincronizando contador de visitas...");
        const [[v1]] = await connSource.execute("SELECT cuenta FROM visitas WHERE id = 1");
        const [[v2]] = await connDest.execute("SELECT cuenta FROM visitas WHERE id = 1");
        
        const count1 = v1 ? v1.cuenta : 0;
        const count2 = v2 ? v2.cuenta : 0;
        const maxVisits = Math.max(count1, count2, 2135); // Forzamos el valor que vimos en el pantallazo si es mayor

        await connDest.execute("INSERT INTO visitas (id, cuenta) VALUES (1, ?) ON DUPLICATE KEY UPDATE cuenta = ?", [maxVisits, maxVisits]);
        console.log(`✅ Visitas fijadas en: ${maxVisits}`);

        console.log("\n✨ UNIFICACIÓN COMPLETADA EN [expedientex].");
        console.log("📝 Siguiente paso: Actualizar .env para usar DB_NAME=expedientex");

    } catch (err) {
        console.error("❌ ERROR CRÍTICO EN LA UNIFICACIÓN:", err.message);
    } finally {
        if (connSource) await connSource.end();
        if (connDest) await connDest.end();
        process.exit(0);
    }
}

unificarBases();
