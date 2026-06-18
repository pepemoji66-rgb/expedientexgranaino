const db = require('../db');

async function checkUser() {
    try {
        console.log("🔍 INVESTIGANDO FICHA DE AGENTES...");
        const users = await db.query("SELECT id, nombre, email, aprobado, rol FROM usuarios ORDER BY id DESC LIMIT 5");
        console.table(users);
        
        if (users.length === 0) {
            console.log("⚠️ No hay agentes registrados.");
        } else {
            console.log("✅ Agentes encontrados. Verificando integridad...");
        }
    } catch (err) {
        console.error("❌ ERROR AL ACCEDER AL ARCHIVO:", err.message);
    } finally {
        process.exit();
    }
}

checkUser();
