const db = require('../db');

async function setupHoroscopo() {
    console.log("⚒️ Preparando tabla de horóscopos...");
    try {
        await db.execute(`CREATE TABLE IF NOT EXISTS horoscopos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            signo TEXT,
            prediccion TEXT,
            fecha DATE DEFAULT CURRENT_DATE
        )`);
        console.log("✅ Tabla 'horoscopos' lista.");
    } catch (err) {
        console.error("❌ Error al crear tabla de horóscopos:", err.message);
    }
}

setupHoroscopo();
