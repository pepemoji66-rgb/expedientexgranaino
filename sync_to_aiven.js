require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');

async function sync() {
    console.log("🚀 INICIANDO SINCRONIZACIÓN TÁCTICA A AIVEN (MYSQL)...");
    
    const config = {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        ssl: { rejectUnauthorized: false }
    };

    const connection = await mysql.createConnection(config);

    const formatMySQLDate = (isoDate) => {
        if (!isoDate) return null;
        return isoDate.replace('T', ' ').replace('Z', '').split('.')[0];
    };

    try {
        if (!fs.existsSync('backup_data.json')) {
            console.error("❌ No se encuentra backup_data.json");
            return;
        }

        const backup = JSON.parse(fs.readFileSync('backup_data.json', 'utf8'));

        // Sincronizar Expedientes (IDs 3 a 7 que son los nuevos)
        const nuevosExpedientes = backup.expedientes.filter(e => [3, 4, 5, 6, 7].includes(e.id));
        for (const exp of nuevosExpedientes) {
            const [rows] = await connection.execute("SELECT id FROM expedientes WHERE id = ?", [exp.id]);
            if (rows.length === 0) {
                console.log(`📥 Insertando Expediente #${exp.id}: ${exp.titulo}`);
                await connection.execute(
                    "INSERT INTO expedientes (id, titulo, contenido, usuario_nombre, latitud, longitud, estado, fecha) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                    [exp.id, exp.titulo, exp.contenido, exp.usuario_nombre, exp.latitud, exp.longitud, exp.estado, formatMySQLDate(exp.fecha)]
                );
            } else {
                console.log(`🔄 Actualizando Expediente #${exp.id}: ${exp.titulo}`);
                await connection.execute(
                    "UPDATE expedientes SET titulo = ?, contenido = ?, usuario_nombre = ?, latitud = ?, longitud = ?, estado = ?, fecha = ? WHERE id = ?",
                    [exp.titulo, exp.contenido, exp.usuario_nombre, exp.latitud, exp.longitud, exp.estado, formatMySQLDate(exp.fecha), exp.id]
                );
            }
        }

        // Sincronizar Noticias (IDs 3 a 7)
        const nuevasNoticias = backup.noticias.filter(n => [3, 4, 5, 6, 7].includes(n.id));
        for (const noti of nuevasNoticias) {
            const [rows] = await connection.execute("SELECT id FROM noticias WHERE id = ?", [noti.id]);
            if (rows.length === 0) {
                console.log(`📥 Insertando Noticia #${noti.id}: ${noti.titulo}`);
                await connection.execute(
                    "INSERT INTO noticias (id, titulo, cuerpo, categoria, autor, imagen_url, estado, fecha, latitud, longitud, aprobado, ubicacion, agente) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    [noti.id, noti.titulo, noti.cuerpo, noti.categoria, noti.autor, noti.imagen_url, noti.estado, formatMySQLDate(noti.fecha), noti.latitud, noti.longitud, noti.aprobado, noti.ubicacion, noti.agente]
                );
            } else {
                console.log(`🔄 Actualizando Noticia #${noti.id}: ${noti.titulo}`);
                await connection.execute(
                    "UPDATE noticias SET titulo = ?, cuerpo = ?, categoria = ?, autor = ?, imagen_url = ?, estado = ?, fecha = ?, latitud = ?, longitud = ?, aprobado = ?, ubicacion = ?, agente = ? WHERE id = ?",
                    [noti.titulo, noti.cuerpo, noti.categoria, noti.autor, noti.imagen_url, noti.estado, formatMySQLDate(noti.fecha), noti.latitud, noti.longitud, noti.aprobado, noti.ubicacion, noti.agente, noti.id]
                );
            }
        }

        // Sincronizar Videos (ID 8)
        const nuevosVideos = backup.videos.filter(v => v.id === 8);
        for (const vid of nuevosVideos) {
            const [rows] = await connection.execute("SELECT id FROM videos WHERE id = ?", [vid.id]);
            if (rows.length === 0) {
                console.log(`📥 Insertando Video #${vid.id}: ${vid.titulo}`);
                await connection.execute(
                    "INSERT INTO videos (id, titulo, url, usuario, estado, fecha, latitud, longitud, capturas) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    [vid.id, vid.titulo, vid.url, vid.usuario, vid.estado, formatMySQLDate(vid.fecha), vid.latitud, vid.longitud, vid.capturas]
                );
            } else {
                console.log(`🔄 Actualizando Video #${vid.id}: ${vid.titulo}`);
                await connection.execute(
                    "UPDATE videos SET titulo = ?, url = ?, usuario = ?, estado = ?, fecha = ?, latitud = ?, longitud = ?, capturas = ? WHERE id = ?",
                    [vid.titulo, vid.url, vid.usuario, vid.estado, formatMySQLDate(vid.fecha), vid.latitud, vid.longitud, vid.capturas, vid.id]
                );
            }
        }

        console.log("🏁 SINCRONIZACIÓN COMPLETADA.");
    } catch (err) {
        console.error("❌ ERROR DURANTE LA SINCRONIZACIÓN:", err.message);
    } finally {
        await connection.end();
    }
}

sync();
