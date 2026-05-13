const axios = require('axios');

async function probeLive() {
    const baseUrl = "https://expedientexgranaino.onrender.com/api";
    const endpoints = [
        "/galeria/noticias-publicas",
        "/galeria/imagenes-publicas",
        "/expedientes/publicos",
        "/videos/publicos",
        "/lugares"
    ];

    console.log("📡 ESCANEANDO EL BÚNKER EN VIVO (RENDER)...");

    for (const ep of endpoints) {
        try {
            const res = await axios.get(`${baseUrl}${ep}`);
            const data = res.data;
            const count = Array.isArray(data) ? data.length : (data.data ? data.data.length : 0);
            console.log(`\n--- 📍 Sector: ${ep} (${count} registros) ---`);
            if (count > 0) {
                const first = Array.isArray(data) ? data[0] : data.data[0];
                console.log(`Ejemplo: ${first.titulo || first.nombre || "Sin título"}`);
            }
        } catch (err) {
            console.error(`❌ Error en ${ep}:`, err.message);
        }
    }
}

probeLive();
