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
            capturas TEXT
        )`);

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

        await db.execute(`CREATE TABLE IF NOT EXISTS chat_mensajes (
            id INT AUTO_INCREMENT PRIMARY KEY, 
            nombre_usuario VARCHAR(255), 
            mensaje TEXT, 
            rol_usuario VARCHAR(50), 
            tipo VARCHAR(50), 
            destinatario VARCHAR(255), 
            fecha DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

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
            aprobado INT DEFAULT 1
        )`);

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

        console.log("✅ Tablas MySQL verificadas.");

    } catch (err) {
        console.error("❌ ERROR CRÍTICO EN LA AUTO-INICIALIZACIÓN MYSQL:", err.message);
    }
};
