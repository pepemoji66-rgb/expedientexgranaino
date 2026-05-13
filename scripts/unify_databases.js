const mysql = require('mysql2/promise');
require('dotenv').config();

async function unify() {
    const commonConfig = {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        ssl: { rejectUnauthorized: false }
    };

    const sourceDbName = 'expedientex';
    const targetDbName = 'expedientex_bunker';

    console.log(`\n🚀 INICIANDO UNIFICACIÓN: ${sourceDbName} -> ${targetDbName}`);

    const sourceConn = await mysql.createConnection({ ...commonConfig, database: sourceDbName });
    const targetConn = await mysql.createConnection({ ...commonConfig, database: targetDbName });

    const tablesToMerge = [
        { name: 'usuarios', uniqueKey: 'email' },
        { name: 'noticias', uniqueKey: 'titulo' },
        { name: 'lugares', uniqueKey: 'nombre' },
        { name: 'videos', uniqueKey: 'url' },
        { name: 'imagenes', uniqueKey: 'url_imagen' },
        { name: 'expedientes', uniqueKey: 'titulo' },
        { name: 'audios', uniqueKey: 'ruta' },
        { name: 'archivos_usuarios', uniqueKey: 'nombre_archivo' },
        { name: 'chat_mensajes', uniqueKey: null }, // Solo insertar si no existe exactamente igual? O solo insertar.
        { name: 'relatos_administrador', uniqueKey: 'titulo' } // Esta tabla solo existe en source segun el log
    ];

    for (const table of tablesToMerge) {
        console.log(`\n--- Procesando tabla: ${table.name} ---`);
        
        // Verificar si la tabla existe en ambos
        try {
            const [sourceRows] = await sourceConn.query(`SELECT * FROM \`${table.name}\``);
            console.log(`  - Registros en origen (${sourceDbName}): ${sourceRows.length}`);

            // Verificar si la tabla existe en target, si no, crearla (o avisar)
            try {
                await targetConn.query(`SELECT 1 FROM \`${table.name}\` LIMIT 1`);
            } catch (e) {
                console.log(`  - La tabla ${table.name} no existe en destino. Intentando crearla...`);
                // Aquí podríamos copiar el schema, pero asumimos que db_init la creó.
                // Si es 'relatos_administrador', puede que falte.
                if (table.name === 'relatos_administrador') {
                    await targetConn.execute(`CREATE TABLE IF NOT EXISTS relatos_administrador (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        titulo VARCHAR(255),
                        contenido TEXT,
                        fecha DATETIME DEFAULT CURRENT_TIMESTAMP
                    )`);
                } else {
                    console.error(`  ❌ Error: La tabla ${table.name} no existe en destino y no tenemos schema manual.`);
                    continue;
                }
            }

            let inserted = 0;
            let skipped = 0;

            for (const row of sourceRows) {
                let exists = false;
                if (table.uniqueKey) {
                    const [check] = await targetConn.query(`SELECT 1 FROM \`${table.name}\` WHERE \`${table.uniqueKey}\` = ?`, [row[table.uniqueKey]]);
                    if (check.length > 0) exists = true;
                } else {
                    // Si no hay uniqueKey, buscamos coincidencia exacta de algunos campos
                    if (table.name === 'chat_mensajes') {
                        const [check] = await targetConn.query(`SELECT 1 FROM \`${table.name}\` WHERE mensaje = ? AND nombre_usuario = ? AND fecha = ?`, [row.mensaje, row.nombre_usuario, row.fecha]);
                        if (check.length > 0) exists = true;
                    }
                }

                if (!exists) {
                    const columns = Object.keys(row).filter(key => key !== 'id'); // Ignoramos ID para que el auto-increment haga su magia
                    const placeholders = columns.map(() => '?').join(', ');
                    const values = columns.map(col => row[col]);
                    
                    await targetConn.execute(`INSERT INTO \`${table.name}\` (${columns.map(c => `\`${c}\``).join(', ')}) VALUES (${placeholders})`, values);
                    inserted++;
                } else {
                    skipped++;
                }
            }
            console.log(`  ✅ Resultado: ${inserted} insertados, ${skipped} omitidos (ya existían).`);

        } catch (err) {
            console.error(`  ❌ Error procesando tabla ${table.name}:`, err.message);
        }
    }

    // Caso especial: visitas (solo hay en target, pero aseguramos que sea 1 si hay 0)
    const [visitasTarget] = await targetConn.query("SELECT COUNT(*) as count FROM visitas");
    if (visitasTarget[0].count === 0) {
        await targetConn.execute("INSERT INTO visitas (id, cuenta) VALUES (1, 1)");
        console.log("\n📍 Inicializado contador de visitas.");
    }

    await sourceConn.end();
    await targetConn.end();
    console.log("\n✨ UNIFICACIÓN COMPLETADA CON ÉXITO.");
}

unify().catch(console.error);
