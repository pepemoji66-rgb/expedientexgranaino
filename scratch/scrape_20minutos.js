const axios = require('axios');

async function scrape20Minutos() {
    try {
        const res = await axios.get('https://www.20minutos.es/horoscopo/diario/aries/', {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const html = res.data;
        // Buscar el texto de la predicción
        const match = html.match(/<div class="horoscope-item-content">([\s\S]*?)<\/div>/);
        if (match) {
            console.log("Encontrado!");
            console.log(match[1].trim().replace(/<[^>]*>?/gm, ''));
        } else {
            console.log("No encontrado");
        }
    } catch (e) {
        console.log("Error: " + e.message);
    }
}

scrape20Minutos();
