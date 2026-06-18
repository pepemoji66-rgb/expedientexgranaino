const mysql = require('mysql2/promise');
require('dotenv').config();

async function buscarNiños() {
    console.log("🕵️ RASTREANDO LA IMAGEN DE LOS NIÑOS EN TODO EL SISTEMA...");
    
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: 'expedientex',
        ssl: { rejectUnauthorized: false }
    });

    const tablas = ['expedientes', 'imagenes', 'noticias', 'videos'];
    
    for (const tabla of tablas) {
        try {
            const [rows] = await conn.execute(`SELECT * FROM ${tabla} WHERE titulo LIKE '%niño%' OR contenido LIKE '%niño%' OR descripcion LIKE '%niño%' OR nombre LIKE '%niño%' OR titulo LIKE '%era%' OR contenido LIKE '%era%'`);
            if (rows.length > 0) {
                console.log(`\n📍 Encontrado en [${tabla}]:`);
                rows.forEach(r => {
                    console.log(`- ID: ${r.id}, Título: ${r.titulo || r.nombre}, Imagen: ${r.imagen_url || r.url || r.url_imagen || 'SÍN IMAGEN'}`);
                });
            }
        } catch (e) {}
    }

    await conn.end();
}

buscarNiños();
