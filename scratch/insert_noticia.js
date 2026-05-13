const db = require('../db.js');

async function insertNoticia() {
    try {
        const sql = `INSERT INTO noticias 
            (titulo, cuerpo, nivel_alerta, ubicacion, latitud, longitud, imagen_url, estado, fecha, aprobado, agente, fuente_url, categoria) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?, ?)`;
        const [result] = await db.execute(sql, [
            "OVNI grabado por dron de soldados ucranianos",
            "Impresionante material en el que soldados ucranianos operando un dron en la zona de conflicto logran captar lo que parece ser un objeto volador no identificado estático en el aire.",
            "Alto",
            "Ucrania",
            48.3794,
            31.1656,
            null,
            "aprobado",
            1,
            "Comandante",
            "https://www.youtube.com/watch?v=o0xzapH3Re8",
            "OVNI"
        ]);
        console.log("Noticia insertada con ID:", result.insertId);
    } catch (err) {
        console.error("Error:", err);
    } finally {
        process.exit();
    }
}
insertNoticia();
