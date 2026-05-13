const { createClient } = require('@libsql/client');
require('dotenv').config();

const db = createClient({
    url: process.env.TURSO_DATABASE_URL || 'file:local.db',
    authToken: process.env.TURSO_AUTH_TOKEN || ''
});

async function migrate() {
    console.log("🛠️  Migración: Añadiendo columna fuente_url a la tabla noticias...");
    try {
        await db.execute("ALTER TABLE noticias ADD COLUMN fuente_url TEXT");
        console.log("✅ Columna añadida correctamente.");
    } catch (err) {
        if (err.message.includes("duplicate column name")) {
            console.log("ℹ️  La columna ya existe, saltando...");
        } else {
            console.error("❌ Error en la migración:", err.message);
        }
    }
}

migrate();
