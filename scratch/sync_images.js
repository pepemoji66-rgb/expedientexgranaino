const db = require('../db');
const fs = require('fs');
const path = require('path');

async function sync() {
    console.log("🔄 Sincronizando nombres de archivos con la base de datos...");
    
    // Lista de archivos reales en la carpeta
    const folderPath = path.join(__dirname, '../public/atarfe');
    if (!fs.existsSync(folderPath)) {
        console.error("❌ Carpeta no encontrada");
        process.exit(1);
    }
    
    const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.jpeg') || f.endsWith('.jpg'));
    console.log("Archivos encontrados:", files);

    try {
        const imgs = await db.query("SELECT id, titulo, url_imagen FROM imagenes WHERE url_imagen LIKE '%atarfe%' ORDER BY id ASC");
        
        for (let i = 0; i < imgs.length; i++) {
            if (files[i]) {
                const newPath = "atarfe/" + files[i];
                console.log(`Updating ID ${imgs[i].id}: ${imgs[i].url_imagen} -> ${newPath}`);
                await db.execute("UPDATE imagenes SET url_imagen = ? WHERE id = ?", [newPath, imgs[i].id]);
            }
        }
        
        console.log("✅ Base de datos actualizada con los nuevos nombres de archivo.");
        process.exit(0);
    } catch (err) {
        console.error("❌ Error en la sincronización:", err);
        process.exit(1);
    }
}

sync();
