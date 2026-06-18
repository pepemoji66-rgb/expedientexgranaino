require('dotenv').config();
const db = require('../db');

async function restaurarContador() {
    try {
        console.log("📡 Conectando con Aiven para restaurar el contador...");
        // Aseguramos que la fila existe
        await db.execute("INSERT IGNORE INTO visitas (id, cuenta) VALUES (1, 1500)");
        // Actualizamos al valor deseado
        await db.execute("UPDATE visitas SET cuenta = 1500 WHERE id = 1");
        console.log("✅ CONTADOR RESTAURADO A 1.500 VISITAS.");
        process.exit(0);
    } catch (err) {
        console.error("❌ ERROR AL RESTAURAR:", err.message);
        process.exit(1);
    }
}

restaurarContador();
