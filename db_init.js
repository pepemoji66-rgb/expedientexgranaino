const fs = require('fs');
const bcrypt = require('bcryptjs');

module.exports = async (db) => {
    console.log("📡 INICIANDO PROTOCOLO DE AUTO-INICIALIZACIÓN DEL BÚNKER (MYSQL)...");

    try {
        // --- 0. VALIDACIÓN DE CONEXIÓN ---
        try {
            await db.query("SELECT 1");
            console.log("🔗 CONEXIÓN CON AIVEN MYSQL ESTABLECIDA.");
        } catch (connErr) {
            console.error("❌ ERROR CRÍTICO: No se puede conectar con Aiven. Revisa los datos en el .env.", connErr.message);
            throw connErr;
        }

        // --- 1. VERIFICACIÓN DE ESTRUCTURA ---
        console.log("⚒️ Verificando búnker de datos...");

        await db.execute(`CREATE TABLE IF NOT EXISTS usuarios (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nombre VARCHAR(255) UNIQUE,
            apellidos VARCHAR(255),
            email VARCHAR(255) UNIQUE,
            password VARCHAR(255),
            rol VARCHAR(50) DEFAULT 'agente',
            rango VARCHAR(50) DEFAULT 'Agente en Prácticas',
            ciudad VARCHAR(255),
            edad INT,
            aprobado INT DEFAULT 0,
            fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
            visitas INT DEFAULT 0,
            puntos_experiencia INT DEFAULT 0,
            misiones_completadas INT DEFAULT 0,
            verificado INT DEFAULT 0,
            fecha_nacimiento VARCHAR(100),
            hora_nacimiento VARCHAR(100),
            ciudad_nacimiento VARCHAR(255),
            lat_nacimiento DOUBLE,
            lon_nacimiento DOUBLE
        )`);

        // Protocolo de parcheo: Asegurar columnas esenciales si no existen
        try {
            await db.execute("ALTER TABLE usuarios ADD COLUMN visitas INT DEFAULT 0");
        } catch (e) {}
        try {
            await db.execute("ALTER TABLE usuarios ADD COLUMN rango VARCHAR(50) DEFAULT 'Agente en Prácticas'");
        } catch (e) {}
        try {
            await db.execute("ALTER TABLE usuarios ADD COLUMN puntos_experiencia INT DEFAULT 0");
        } catch (e) {}
        try {
            await db.execute("ALTER TABLE usuarios ADD COLUMN misiones_completadas INT DEFAULT 0");
        } catch (e) {}
        try {
            await db.execute("ALTER TABLE usuarios ADD COLUMN verificado INT DEFAULT 0");
        } catch (e) {}

        await db.execute(`CREATE TABLE IF NOT EXISTS videos (
            id INT AUTO_INCREMENT PRIMARY KEY,
            titulo VARCHAR(255),
            url VARCHAR(255),
            usuario VARCHAR(255),
            estado VARCHAR(50) DEFAULT 'pendiente',
            fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
            latitud DOUBLE DEFAULT 0,
            longitud DOUBLE DEFAULT 0,
            capturas TEXT,
            descripcion TEXT
        )`);

        try {
            await db.execute("ALTER TABLE videos ADD COLUMN descripcion TEXT");
            console.log("🩹 PARCHE APLICADO: Columna 'descripcion' añadida a videos.");
        } catch (e) {}

        await db.execute(`CREATE TABLE IF NOT EXISTS imagenes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            titulo VARCHAR(255),
            url_imagen VARCHAR(255),
            agente VARCHAR(255),
            descripcion TEXT,
            latitud DOUBLE DEFAULT 0,
            longitud DOUBLE DEFAULT 0,
            estado VARCHAR(50) DEFAULT 'pendiente',
            fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
            es_atarfe INT DEFAULT 0
        )`);

        // Protocolo de parcheo: Asegurar columna es_atarfe si no existe
        try {
            await db.execute("ALTER TABLE imagenes ADD COLUMN es_atarfe INT DEFAULT 0");
            console.log("🩹 PARCHE APLICADO: Columna 'es_atarfe' añadida a imágenes.");
        } catch (e) {
            // Ya existe o error menor
        }

        await db.execute(`CREATE TABLE IF NOT EXISTS expedientes (
            id INT AUTO_INCREMENT PRIMARY KEY, 
            titulo VARCHAR(255), 
            contenido TEXT, 
            usuario_nombre VARCHAR(255), 
            latitud DOUBLE DEFAULT 0, 
            longitud DOUBLE DEFAULT 0, 
            estado VARCHAR(50) DEFAULT 'pendiente', 
            fecha DATETIME DEFAULT CURRENT_TIMESTAMP, 
            tipo VARCHAR(50) DEFAULT 'agente',
            imagen_url VARCHAR(255),
            relevancia INT DEFAULT 0
        )`);

        // Protocolo de parcheo: Asegurar columna relevancia si no existe
        try {
            await db.execute("ALTER TABLE expedientes ADD COLUMN relevancia INT DEFAULT 0");
            console.log("🩹 PARCHE APLICADO: Columna 'relevancia' añadida a expedientes.");
        } catch (e) { }

        await db.execute(`CREATE TABLE IF NOT EXISTS casos_abiertos (
            id INT AUTO_INCREMENT PRIMARY KEY,
            titulo VARCHAR(255),
            contenido TEXT,
            imagen_url VARCHAR(255),
            latitud DOUBLE DEFAULT 0,
            longitud DOUBLE DEFAULT 0,
            estado VARCHAR(50) DEFAULT 'pendiente',
            fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
            titulo_en VARCHAR(255),
            contenido_en TEXT,
            fuente_url TEXT
        )`);

        try {
            await db.execute("ALTER TABLE casos_abiertos ADD COLUMN fuente_url TEXT");
            console.log("🩹 PARCHE APLICADO: Columna 'fuente_url' añadida a casos_abiertos.");
        } catch (e) {}

        await db.execute(`CREATE TABLE IF NOT EXISTS noticias (
            id INT AUTO_INCREMENT PRIMARY KEY, 
            titulo VARCHAR(255), 
            cuerpo TEXT, 
            categoria VARCHAR(100),
            nivel_alerta VARCHAR(50) DEFAULT 'Bajo', 
            autor VARCHAR(255), 
            imagen_url VARCHAR(255), 
            estado VARCHAR(50) DEFAULT 'aprobado', 
            fecha DATETIME DEFAULT CURRENT_TIMESTAMP, 
            latitud DOUBLE, 
            longitud DOUBLE, 
            aprobado INT DEFAULT 1, 
            ubicacion VARCHAR(255), 
            agente VARCHAR(255),
            fuente_url TEXT
        )`);

        await db.execute(`CREATE TABLE IF NOT EXISTS lugares (
            id INT AUTO_INCREMENT PRIMARY KEY, 
            titulo VARCHAR(255), 
            nombre VARCHAR(255), 
            descripcion TEXT, 
            latitud DOUBLE, 
            longitud DOUBLE, 
            imagen_url VARCHAR(255), 
            ubicacion VARCHAR(255), 
            estado VARCHAR(50) DEFAULT 'pendiente', 
            fecha DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        await db.execute(`CREATE TABLE IF NOT EXISTS audios (
            id INT AUTO_INCREMENT PRIMARY KEY, 
            titulo VARCHAR(255), 
            ruta VARCHAR(255), 
            agente VARCHAR(255), 
            autor VARCHAR(255), 
            latitud DOUBLE DEFAULT 0, 
            longitud DOUBLE DEFAULT 0, 
            aprobado INT DEFAULT 0, 
            fecha_subida DATETIME DEFAULT CURRENT_TIMESTAMP,
            estado VARCHAR(50) DEFAULT 'pendiente',
            imagen_url VARCHAR(255)
        )`);

        // Parche para audios existentes
        try {
            await db.execute("ALTER TABLE audios ADD COLUMN imagen_url VARCHAR(255)");
            console.log("🩹 PARCHE APLICADO: Columna 'imagen_url' añadida a audios.");
        } catch (e) { }

        await db.execute(`CREATE TABLE IF NOT EXISTS archivos_usuarios (
            id INT AUTO_INCREMENT PRIMARY KEY, 
            nombre_archivo VARCHAR(255), 
            agente VARCHAR(255), 
            fecha DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        await db.execute(`CREATE TABLE IF NOT EXISTS horoscopos (
            id INT AUTO_INCREMENT PRIMARY KEY, 
            signo VARCHAR(50), 
            prediccion TEXT, 
            prediccion_en TEXT,
            fecha DATE
        )`);

        // Parche: añadir prediccion_en si no existe
        try {
            await db.execute("ALTER TABLE horoscopos ADD COLUMN prediccion_en TEXT");
            console.log("🩹 PARCHE APLICADO: Columna 'prediccion_en' añadida a horoscopos.");
        } catch (e) { /* Ya existe */ }

        // Limpieza preventiva: borrar hoy si hay predicciones duplicadas O en idioma incorrecto
        try {
            const today = new Date().toISOString().split('T')[0];
            const rows = await db.query("SELECT prediccion, prediccion_en FROM horoscopos WHERE fecha = ?", [today]);
            if (rows.length >= 2) {
                const predsEs = rows.map(r => r.prediccion || '');
                const set = new Set(predsEs);
                const hayDuplicados = set.size < rows.length * 0.8;
                // Detectar si la columna española tiene texto inglés (bug anterior)
                const hayInglesEnEspanol = predsEs.filter(p =>
                    p.includes('Health:') || p.includes('Money:') || p.includes('Love:')
                ).length >= 3;

                if (hayDuplicados || hayInglesEnEspanol) {
                    await db.execute("DELETE FROM horoscopos WHERE fecha = ?", [today]);
                    const razon = hayInglesEnEspanol ? 'idioma incorrecto detectado' : 'predicciones duplicadas';
                    console.log(`🧹 LIMPIEZA: Horóscopo borrado (${razon}). Se regenerará correctamente.`);
                }
            }
        } catch (e) { }


        await db.execute(`CREATE TABLE IF NOT EXISTS efemerides (
            id INT AUTO_INCREMENT PRIMARY KEY,
            titulo VARCHAR(255),
            contenido TEXT,
            anio_evento INT DEFAULT 0,
            ubicacion VARCHAR(255),
            categoria VARCHAR(100) DEFAULT 'PARANORMAL',
            fecha DATE
        )`);

        await db.execute(`CREATE TABLE IF NOT EXISTS noticias_externas (
            id INT AUTO_INCREMENT PRIMARY KEY,
            titulo VARCHAR(255),
            resumen TEXT,
            url TEXT,
            fuente VARCHAR(100),
            categoria VARCHAR(50),
            icono VARCHAR(10),
            imagen_url TEXT,
            fecha_publicacion DATETIME,
            fecha_cache DATE
        )`);

        await db.execute(`CREATE TABLE IF NOT EXISTS comentarios (
            id INT AUTO_INCREMENT PRIMARY KEY, 
            agente VARCHAR(255), 
            mensaje TEXT, 
            fecha DATETIME DEFAULT CURRENT_TIMESTAMP, 
            aprobado INT DEFAULT 1,
            item_key VARCHAR(255) DEFAULT NULL
        )`);

        await db.execute(`CREATE TABLE IF NOT EXISTS misterios_historicos (
            id INT AUTO_INCREMENT PRIMARY KEY,
            titulo VARCHAR(255),
            titulo_en VARCHAR(255),
            contenido TEXT,
            contenido_en TEXT,
            imagen_url VARCHAR(255),
            latitud DOUBLE DEFAULT 0,
            longitud DOUBLE DEFAULT 0,
            estado VARCHAR(50) DEFAULT 'aprobado',
            fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
            fuente_url TEXT
        )`);

        try {
            await db.execute("ALTER TABLE misterios_historicos ADD COLUMN fuente_url TEXT");
            console.log("🩹 PARCHE APLICADO: Columna 'fuente_url' añadida a misterios_historicos.");
        } catch (e) {}

        const rowsMisterios = await db.query("SELECT COUNT(*) as total FROM misterios_historicos");
        if (rowsMisterios[0].total === 0) {
            console.log("🌱 Sembrando misterios históricos por defecto...");
            const misteriosIniciales = [
                {
                    titulo: "El Incidente OVNI de Roswell",
                    titulo_en: "The Roswell UFO Incident",
                    contenido: "En julio de 1947, un objeto volador no identificado se estrelló en un rancho cerca de Roswell, Nuevo México. Aunque el ejército inicialmente reportó la recuperación de un 'disco volador', rápidamente cambiaron la versión afirmando que se trataba de un globo meteorológico convencional. Décadas de testigos, conspiraciones y documentos desclasificados sugieren la recuperación de tecnología extraterrestre y cuerpos no humanos en el desierto, convirtiendo a Roswell en el epicentro de la ufología mundial.",
                    contenido_en: "In July 1947, an unidentified flying object crashed at a ranch near Roswell, New Mexico. Although the military initially reported recovering a 'flying disc', they quickly changed their story, claiming it was a conventional weather balloon. Decades of witnesses, conspiracies, and declassified documents suggest the recovery of extraterrestrial technology and non-human bodies in the desert, turning Roswell into the epicenter of global ufology.",
                    imagen_url: "roswell.jpg",
                    latitud: 33.3943,
                    longitud: -104.5230
                },
                {
                    titulo: "El Misterio del Triángulo de las Bermudas",
                    titulo_en: "The Mystery of the Bermuda Triangle",
                    contenido: "Una vasta región del Océano Atlántico occidental conocida por la desaparición inexplicable de decenas de barcos y aviones, incluyendo el famoso Vuelo 19 en 1945. Las brújulas fallan, las transmisiones se cortan y las naves desaparecen sin dejar rastro de combustible ni restos. Las hipótesis van desde anomalías magnéticas y liberaciones de gas metano hasta portales dimensionales y actividad extraterrestre.",
                    contenido_en: "A vast region of the western Atlantic Ocean known for the unexplained disappearance of dozens of ships and aircraft, including the famous Flight 19 in 1945. Compasses fail, transmissions cut off, and vessels vanish without leaving oil slicks or debris. Hypotheses range from magnetic anomalies and methane gas releases to dimensional portals and extraterrestrial activity.",
                    imagen_url: "bermuda.jpg",
                    latitud: 25.0000,
                    longitud: -71.0000
                },
                {
                    titulo: "El Manuscrito Voynich: El Libro Indescifrable",
                    titulo_en: "The Voynich Manuscript: The Undecipherable Book",
                    contenido: "Un documento ilustrado del siglo XV escrito en un sistema de escritura y lenguaje completamente desconocidos. A pesar de los esfuerzos de los criptógrafos militares más brillantes del mundo y de las inteligencias artificiales modernas, su contenido sigue siendo un misterio absoluto. Sus páginas contienen extrañas ilustraciones de plantas inexistentes, diagramas cosmológicos y figuras femeninas en baños alquímicos.",
                    contenido_en: "An illustrated codex from the 15th century written in an entirely unknown writing system and language. Despite the efforts of the world's most brilliant military cryptographers and modern artificial intelligences, its content remains an absolute mystery. Its pages contain strange drawings of non-existent plants, cosmological diagrams, and female figures in alchemical baths.",
                    imagen_url: "voynich.jpg",
                    latitud: 41.9028,
                    longitud: 12.4964
                },
                {
                    titulo: "La Colonia Perdida de Roanoke",
                    titulo_en: "The Lost Colony of Roanoke",
                    contenido: "En 1587, más de un centenar de colonos ingleses se establecieron en la isla de Roanoke. Tres años después, cuando llegó una expedición de reabastecimiento, la colonia entera había desaparecido sin rastro de lucha o violencia. La única pista era la palabra 'CROATOAN' tallada en un poste de madera. El destino de los colonos sigue siendo uno de los mayores enigmas de la historia de América del Norte.",
                    contenido_en: "In 1587, more than a hundred English settlers established themselves on Roanoke Island. Three years later, when a resupply expedition arrived, the entire colony had vanished without any sign of struggle or violence. The only clue was the word 'CROATOAN' carved into a wooden post. The fate of the settlers remains one of North America's greatest historical enigmas.",
                    imagen_url: "roanoke.jpg",
                    latitud: 35.9396,
                    longitud: -75.7201
                },
                {
                    titulo: "El Asesino del Zodiaco",
                    titulo_en: "The Zodiac Killer",
                    contenido: "Un asesino en serie que aterrorizó el norte de California a finales de los años 60 y principios de los 70. Se autodenominó 'Zodiaco' en cartas enviadas a la prensa local, las cuales contenían criptogramas y amenazas complejas. Aunque se le atribuyen oficialmente cinco víctimas mortales, el asesino afirmaba haber matado a 37 personas. Su identidad real sigue siendo un misterio sin resolver y sus cifrados continúan desafiando a los investigadores.",
                    contenido_en: "A serial killer who terrorized Northern California in the late 1960s and early 1970s. He dubbed himself 'Zodiac' in letters sent to the local press, which contained complex cryptograms and threats. Although officially linked to five murders, the killer claimed to have killed 37 people. His true identity remains an unsolved mystery, and his ciphers continue to challenge investigators.",
                    imagen_url: "zodiac.jpg",
                    latitud: 37.7749,
                    longitud: -122.4194
                }
            ];

            for (const m of misteriosIniciales) {
                await db.execute(
                    "INSERT INTO misterios_historicos (titulo, titulo_en, contenido, contenido_en, imagen_url, latitud, longitud, estado) VALUES (?, ?, ?, ?, ?, ?, ?, 'aprobado')",
                    [m.titulo, m.titulo_en, m.contenido, m.contenido_en, m.imagen_url, m.latitud, m.longitud]
                );
            }
            console.log("🌱 Siembra de misterios históricos completada con éxito.");
        }


        await db.execute(`CREATE TABLE IF NOT EXISTS archipeg_solicitudes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            usuario_id INT,
            nombre VARCHAR(255),
            email VARCHAR(255),
            tipo VARCHAR(50),
            estado VARCHAR(50) DEFAULT 'pendiente',
            fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
            fecha_envio DATETIME NULL,
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
        )`);
        console.log("🩹 TABLA: archipeg_solicitudes inicializada en MySQL.");

        await db.execute(`CREATE TABLE IF NOT EXISTS visitas (
            id INT PRIMARY KEY, 
            cuenta INT DEFAULT 0
        )`);

        // Inicializar contador si no existe (Protocolo Robusto)
        const rows = await db.query("SELECT COUNT(*) as total FROM visitas");
        if (rows[0].total === 0) {
            await db.execute("INSERT INTO visitas (id, cuenta) VALUES (1, 2120)");
            console.log("🔢 Contador de visitas inicializado a 2120.");
        } else {
            console.log("🔢 Contador de visitas ya activo. Protocolo de preservación activado.");
        }

        // --- SISTEMA DE AFILIADOS AMAZON (NINJA) ---
        await db.execute(`CREATE TABLE IF NOT EXISTS amazon_afiliados (
            item_key VARCHAR(100) PRIMARY KEY,
            datos_json TEXT
        )`);
        console.log("🩹 TABLA: amazon_afiliados inicializada en MySQL.");

        console.log("✅ Tablas MySQL verificadas.");

    } catch (err) {
        console.error("❌ ERROR CRÍTICO EN LA AUTO-INICIALIZACIÓN MYSQL:", err.message);
    }
};
