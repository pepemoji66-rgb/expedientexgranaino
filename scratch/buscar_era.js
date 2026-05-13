require('dotenv').config();
const db = require('../db');

async function buscarExpediente() {
    try {
        console.log("🔍 BUSCANDO 'LA VISITA EN LA ERA'...");
        
        // Buscamos por título o contenido que contenga 'era'
        const rows = await db.query(
            "SELECT * FROM expedientes WHERE titulo LIKE '%VISITA%' OR contenido LIKE '%VISITA%' OR titulo LIKE '%ERA%' OR contenido LIKE '%ERA%'"
        );

        if (rows.length > 0) {
            console.log(`✅ SE HAN ENCONTRADO ${rows.length} COINCIDENCIAS:`);
            rows.forEach(row => {
                console.log("-----------------------------------------");
                console.log(`ID: ${row.id}`);
                console.log(`TÍTULO: ${row.titulo}`);
                console.log(`CONTENIDO (fragmento): ${row.contenido.substring(0, 100)}...`);
                console.log("-----------------------------------------");
            });
        } else {
            console.log("❌ NO SE ENCONTRÓ NINGÚN EXPEDIENTE CON 'ERA' EN EL TÍTULO O CONTENIDO.");
            
            // Intentamos buscar algo más genérico por si acaso
            const allExp = await db.query("SELECT titulo FROM expedientes LIMIT 10");
            console.log("\nÚltimos expedientes en la base de datos:");
            allExp.forEach(e => console.log(`- ${e.titulo}`));
        }
        process.exit(0);
    } catch (err) {
        console.error("❌ ERROR EN LA BÚSQUEDA:", err.message);
        process.exit(1);
    }
}

buscarExpediente();
