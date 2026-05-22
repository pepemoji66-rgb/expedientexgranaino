const db = require('./db');

async function patch() {
    try {
        console.log("🛠️ Parcheando la base de datos para Casos Abiertos...");
        
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
            contenido_en TEXT
        )`);

        console.log("✅ Tabla 'casos_abiertos' creada o ya existía.");
        process.exit(0);
    } catch (err) {
        console.error("❌ Error aplicando el parche:", err);
        process.exit(1);
    }
}

patch();
