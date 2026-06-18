const mysql = require('mysql2/promise');

const config = {
    host: 'mysql-1cd66845-pepemoji66-a012.c.aivencloud.com',
    port: 11475,
    user: 'avnadmin',
    password: 'AVNS_f1PJAUD3s5YOIS98BUr',
    database: 'egipto_db',
    ssl: { rejectUnauthorized: false }
};

async function seed() {
    let connection;
    try {
        console.log("📡 Conectando a Aiven MySQL...");
        connection = await mysql.createConnection(config);
        console.log("✅ Conexión establecida.");

        // 1. Limpiar datos viejos
        console.log("🧹 Limpiando tablas...");
        await connection.query("DELETE FROM `monumentos_360`");
        await connection.query("DELETE FROM `audios`");
        await connection.query("DELETE FROM `videos`");
        await connection.query("DELETE FROM `imagenes`");
        await connection.query("DELETE FROM `usuarios`");
        await connection.query("DELETE FROM `noticias`");

        // 2. Inserción de monumentos_360
        console.log("📦 Insertando monumentos 360...");
        const monumentos = [
            ["La Gran Esfinge", "La Gran Esfinge de Giza 360", "El legendario guardián con cuerpo de león y cabeza humana visto desde el aire.", "esfinge.mp4"],
            ["Templo de Luxor", "Templo de Luxor 360", "Recorrido aéreo entre las monumentales columnas del templo de Luxor.", "templo.mp4"],
            ["Colosos de Memnón", "Colosos de Memnón 360", "Vuela sobre las gigantescas estatuas de piedra del faraón Amenhotep III.", "TumbaMemnon.mp4"],
            ["Templo de Nefertiti", "Templo de Nefertiti 360", "Explora la entrada y jeroglíficos del templo dedicado a Nefertiti.", "TemploNefertiti.mp4"],
            ["Tumba KV14", "Cámara Funeraria KV14 360", "Exploración de la tumba de la reina Tausert y el rey Setnajt en el Valle de los Reyes.", "tumbaKV14.mp4"],
            ["Tumbas de Luxor", "Valle de los Reyes 360", "Sobrevuelo sobre las colinas rocosas que esconden las tumbas de los faraones.", "tumbaLuxor.mp4"],
            ["Alejandría", "Ruinas de Alejandría 360", "Vista de dron sobre las costas y ruinas de Alejandría.", "Alejandria.mp4"]
        ];
        for (const m of monumentos) {
            await connection.query(
                "INSERT INTO `monumentos_360` (nombre, titulo, descripcion, url_mapa) VALUES (?, ?, ?, ?)",
                m
            );
        }

        // 3. Inserción de audios
        console.log("📦 Insertando audios...");
        const audios = [
            ["El Secreto de las Pirámides", "/audios/audio2.mp3"],
            ["La Maldición de Tutankamón", "/audios/audio3.mp3"],
            ["El Misterio de la Cámara de los Registros", "/audios/audioseccion.mp3"]
        ];
        for (const a of audios) {
            await connection.query(
                "INSERT INTO `audios` (titulo, url) VALUES (?, ?)",
                a
            );
        }

        // 4. Inserción de videos
        console.log("📦 Insertando videos...");
        const videos = [
            ["El Origen de los Faraones", "/videos/1.mp4"],
            ["La Alineación Estelar de Giza", "/videos/2.mp4"],
            ["La Construcción de la Gran Pirámide", "/videos/3.mp4"],
            ["La Esfinge y sus Cámaras Ocultas", "/videos/video4.mp4"]
        ];
        for (const v of videos) {
            await connection.query(
                "INSERT INTO `videos` (titulo, url) VALUES (?, ?)",
                v
            );
        }

        // 5. Inserción de imágenes con coordenadas para el mapa interactivo
        console.log("📦 Insertando imágenes con coordenadas...");
        // id, titulo, url, orden, descripcion, latitud, longitud (orden default 0)
        // Nota: Asegúrate de que las columnas existan en la tabla imagenes. La tabla en database_init.sql tiene: id, titulo, url, orden.
        // Pero en App.js lee: descripcion, latitud, longitud. Vamos a alterar la tabla en Aiven si no tiene las columnas latitud/longitud/descripcion.
        
        // Comprobar y crear columnas si faltan en la tabla imagenes de Aiven
        const [columns] = await connection.query("SHOW COLUMNS FROM `imagenes`");
        const hasDesc = columns.some(c => c.Field === 'descripcion');
        const hasLat = columns.some(c => c.Field === 'latitud');
        const hasLng = columns.some(c => c.Field === 'longitud');

        if (!hasDesc) {
            console.log("➕ Añadiendo columna 'descripcion' a imagenes...");
            await connection.query("ALTER TABLE `imagenes` ADD COLUMN `descripcion` TEXT");
        }
        if (!hasLat) {
            console.log("➕ Añadiendo columna 'latitud' a imagenes...");
            await connection.query("ALTER TABLE `imagenes` ADD COLUMN `latitud` VARCHAR(50)");
        }
        if (!hasLng) {
            console.log("➕ Añadiendo columna 'longitud' a imagenes...");
            await connection.query("ALTER TABLE `imagenes` ADD COLUMN `longitud` VARCHAR(50)");
        }

        const imagenes = [
            ["La Esfinge de Giza", "/imagenes/esfinge.jpg", 1, "El legendario guardián tallado en caliza en la meseta de Giza.", "29.9753", "31.1376"],
            ["Alineación de Orión", "/imagenes/orion-giza.jpg", 2, "Representación de la correlación estelar de las pirámides con el Cinturón de Orión.", "29.9773", "31.1325"],
            ["Pirámide de Keops", "/imagenes/1.avif", 3, "La Gran Pirámide, la única de las siete maravillas del mundo antiguo que aún perdura.", "29.9792", "31.1342"],
            ["Pirámide de Kefrén", "/imagenes/2.avif", 4, "La segunda pirámide más grande de Giza, construida por el faraón Kefrén.", "29.9758", "31.1308"],
            ["Pirámide de Micerino", "/imagenes/3.avif", 5, "La menor de las tres pirámides principales de la meseta de Giza.", "29.9725", "31.1283"],
            ["Templo de Hatshepsut", "/imagenes/4.avif", 6, "El majestuoso templo funerario tallado directamente en los acantilados de Deir el-Bahari.", "25.7382", "32.6067"],
            ["Abu Simbel", "/imagenes/5.avif", 7, "Los colosales templos de Ramsés II excavados en la roca en Nubia.", "22.3372", "31.6258"],
            ["Jeroglíficos de Karnak", "/imagenes/6.avif", 8, "Inscripciones sagradas talladas en las inmensas columnas del templo de Karnak.", "25.7188", "32.6573"],
            ["El Valle de los Reyes", "/imagenes/7.avif", 9, "El gran cementerio real donde se descubrieron las tumbas de los faraones del Imperio Nuevo.", "25.7402", "32.6014"],
            ["El Río Nilo en Asuán", "/imagenes/8.avif", 10, "El río sagrado que dio origen a la civilización egipcia a su paso por Asuán.", "24.0889", "32.8998"]
        ];

        for (const img of imagenes) {
            await connection.query(
                "INSERT INTO `imagenes` (titulo, url, orden, descripcion, latitud, longitud) VALUES (?, ?, ?, ?, ?, ?)",
                img
            );
        }

        // 6. Inserción de usuario administrador por defecto
        console.log("📦 Insertando usuario administrador...");
        await connection.query(
            "INSERT INTO `usuarios` (nombre, email, ciudad, edad, sexo, password) VALUES (?, ?, ?, ?, ?, ?)",
            ["Jose Jefe", "pepemoji66@gmail.com", "Granada", 40, "M", "pepemio"]
        );

        // 7. Inserción de algunas noticias iniciales de Egipto
        console.log("📦 Insertando noticias iniciales...");
        const noticias = [
            ["Descubrimiento sensacional en Saqqara", "Arqueólogos encuentran una tumba intacta de la dinastía V con jeroglíficos perfectamente conservados.", "https://www.huffingtonpost.es/sociedad/tras-piramides-momias-faraones-arqueologos-dan-descubrimiento-sensacional-arenas-egipto.html", "/imagenes/esfinge.jpg"],
            ["Luxor revela estatuas colosales restauradas", "Egipto presentó dos estatuas gigantes de Amenhotep III restauradas tras casi 20 años de minucioso trabajo arqueológico en la orilla occidental.", "https://www.huffingtonpost.es", "/imagenes/6.avif"]
        ];
        for (const n of noticias) {
            await connection.query(
                "INSERT INTO `noticias` (titulo, resumen, url_enlace, url_imagen) VALUES (?, ?, ?, ?)",
                n
            );
        }

        console.log("\n🎉 ¡BASE DE DATOS DE EGIPTO SEMBRADA CON ÉXITO EN AIVEN CLOUD!");

    } catch (error) {
        console.error("❌ ERROR CRÍTICO durante el sembrado:", error);
    } finally {
        if (connection) {
            await connection.end();
            console.log("🔌 Conexión cerrada.");
        }
    }
}

seed();
