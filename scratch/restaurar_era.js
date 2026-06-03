const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrarExpediente() {
    console.log("🚀 INICIANDO RESCATE DEL EXPEDIENTE...");
    
    let connSource, connDest;
    try {
        // 1. Conectar a la fuente (donde está el registro perdido)
        connSource = await mysql.createConnection({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: 'expedientex',
            ssl: { rejectUnauthorized: false }
        });

        // 2. Recuperar el registro
        const [rows] = await connSource.execute("SELECT * FROM expedientes WHERE id = 19");
        if (rows.length === 0) {
            console.error("❌ No se encontró el expediente con ID 19.");
            process.exit(1);
        }

        const exp = rows[0];
        console.log(`✅ Registro recuperado: ${exp.titulo}`);

        // 3. Conectar al destino (Búnker principal)
        connDest = await mysql.createConnection({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: 'expedientex_bunker',
            ssl: { rejectUnauthorized: false }
        });

        // 4. Inyectar con el nuevo nombre y estado aprobado
        const sql = `INSERT INTO expedientes (titulo, contenido, usuario_nombre, latitud, longitud, estado, tipo, fecha) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
        
        const params = [
            'LA VISITA EN LA ERA', // Renombrado como pidió el usuario
            exp.contenido,
            'Pepe Moreno', // Atribuido al administrador
            exp.latitud || 0,
            exp.longitud || 0,
            'aprobado',
            'jefe', // Como relato del jefe
            new Date().toISOString().slice(0, 19).replace('T', ' ')
        ];

        await connDest.execute(sql, params);
        console.log("✨ EXPEDIENTE RESTAURADO Y RENOMBRADO EN EL BÚNKER PRINCIPAL.");

    } catch (err) {
        console.error("❌ ERROR DURANTE LA OPERACIÓN:", err.message);
    } finally {
        if (connSource) await connSource.end();
        if (connDest) await connDest.end();
        process.exit(0);
    }
}

migrarExpediente();
