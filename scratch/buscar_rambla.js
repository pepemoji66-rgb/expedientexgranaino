require('dotenv').config();
const db = require('../db');

async function buscarExpediente() {
    try {
        console.log("🔍 BUSCANDO 'LA LUZ DE LA RAMBLA' EN EL BÚNKER...");
        const results = await db.query("SELECT * FROM expedientes WHERE titulo LIKE '%Rambla%' OR contenido LIKE '%Rambla%'");
        
        if (results.length > 0) {
            console.log(`✅ ¡ENCONTRADO! Hay ${results.length} registros relacionados.`);
            results.forEach(exp => {
                console.log(`📌 Título: ${exp.titulo}`);
                console.log(`📅 Fecha: ${exp.fecha}`);
                console.log(`🛡️ Estado: ${exp.estado}`);
                console.log("-----------------------------------------");
            });
        } else {
            console.log("❌ NO SE ENCUENTRA EN AIVEN. COMPROBANDO OTROS SECTORES...");
            const all = await db.query("SELECT titulo FROM expedientes ORDER BY id DESC LIMIT 10");
            console.log("Últimos 10 expedientes en Aiven:");
            all.forEach(a => console.log(`- ${a.titulo}`));
        }
        process.exit(0);
    } catch (err) {
        console.error("❌ ERROR EN LA BÚSQUEDA:", err.message);
        process.exit(1);
    }
}

buscarExpediente();
