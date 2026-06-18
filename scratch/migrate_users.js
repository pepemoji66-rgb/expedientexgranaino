const { createClient } = require('@libsql/client');
const fs = require('fs');
require('dotenv').config();

// CONFIGURACIÓN DE ORIGEN (TURSO - Comentado en .env)
// Extraemos manualmente si están comentados
const envContent = fs.readFileSync('.env', 'utf8');
const tursoUrlMatch = envContent.match(/# TURSO_DATABASE_URL=(.+)/);
const tursoTokenMatch = envContent.match(/# TURSO_AUTH_TOKEN=(.+)/);

const TURSO_URL = tursoUrlMatch ? tursoUrlMatch[1].trim() : process.env.TURSO_DATABASE_URL;
const TURSO_TOKEN = tursoTokenMatch ? tursoTokenMatch[1].trim() : process.env.TURSO_AUTH_TOKEN;

// CONFIGURACIÓN DE DESTINO (LOCAL)
const LOCAL_URL = 'file:local.db';

async function migrateUsers() {
    if (!TURSO_URL || !TURSO_TOKEN) {
        console.error("❌ Error: No se encontraron credenciales de Turso en el .env (ni comentadas ni activas).");
        return;
    }

    console.log("📡 Conectando con Turso para recuperar agentes...");
    const tursoClient = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN });
    
    console.log("🏠 Conectando con Búnker Local...");
    const localClient = createClient({ url: LOCAL_URL });

    try {
        // 1. Obtener usuarios de Turso
        console.log("🔍 Extrayendo usuarios de la nube...");
        const result = await tursoClient.execute("SELECT * FROM usuarios");
        const usuarios = result.rows;

        console.log(`✅ Se han encontrado ${usuarios.length} agentes en la nube.`);

        // 2. Insertar en Local
        for (const row of usuarios) {
            const keys = result.columns;
            const values = Object.values(row);
            const placeholders = keys.map(() => '?').join(', ');
            const columns = keys.map(k => `\`${k}\``).join(', ');

            try {
                await localClient.execute({
                    sql: `INSERT OR IGNORE INTO usuarios (${columns}) VALUES (${placeholders})`,
                    args: values
                });
                console.log(`👤 Agente migrado: ${row.nombre || row.email}`);
            } catch (err) {
                console.error(`⚠️ Error migrando a ${row.nombre}:`, err.message);
            }
        }

        console.log("🏁 MIGRACIÓN COMPLETADA. Los agentes de Turso ya están en el Búnker Local.");

    } catch (err) {
        console.error("❌ Error durante la migración:", err.message);
    }
}

migrateUsers();
