const db = require('../db');

async function checkAtarfe() {
    try {
        console.log("--- BUSCANDO REGISTROS DE ATARFE ---");
        const [noticias] = await db.execute('SELECT id, titulo, latitud, longitud FROM noticias WHERE titulo LIKE ? OR ubicacion LIKE ?', ['%Atarfe%', '%Atarfe%']);
        const [imagenes] = await db.execute('SELECT id, titulo, latitud, longitud FROM imagenes WHERE titulo LIKE ? OR descripcion LIKE ?', ['%Atarfe%', '%Atarfe%']);
        const [lugares] = await db.execute('SELECT id, nombre, latitud, longitud FROM lugares WHERE nombre LIKE ? OR titulo LIKE ?', ['%Atarfe%', '%Atarfe%']);

        console.log("NOTICIAS:", JSON.stringify(noticias, null, 2));
        console.log("IMAGENES:", JSON.stringify(imagenes, null, 2));
        console.log("LUGARES:", JSON.stringify(lugares, null, 2));
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkAtarfe();
