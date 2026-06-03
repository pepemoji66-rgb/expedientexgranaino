require('dotenv').config();
const db = require('../db');

async function fixContador() {
    try {
        console.log("🔢 FIJANDO CONTADOR EN 2120 VISITAS...");
        // Primero intentamos actualizar
        const result = await db.execute("UPDATE visitas SET cuenta = 2120 WHERE id = 1");
        
        // Si no se actualizó nada (porque no existía la fila id=1), la insertamos
        if (result.rowsAffected === 0) {
            await db.execute("INSERT INTO visitas (id, cuenta) VALUES (1, 2120)");
        }
        
        console.log("✅ CONTADOR FIJADO Y ASEGURADO.");
        process.exit(0);
    } catch (err) {
        console.error("❌ ERROR AL FIJAR CONTADOR:", err.message);
        process.exit(1);
    }
}

fixContador();
