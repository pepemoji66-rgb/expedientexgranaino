const axios = require('axios');

async function checkSources() {
    const sources = [
        'https://api.xor.cl/tyaas/',
        'https://api.leolabs.org/horoscopo',
        'https://api.allorigins.win/get?url=' + encodeURIComponent('https://api.xor.cl/tyaas/')
    ];

    for (const source of sources) {
        console.log(`Probando fuente: ${source}`);
        try {
            const res = await axios.get(source, { timeout: 10000 });
            console.log(`Éxito con ${source}!`);
            console.log(JSON.stringify(res.data).substring(0, 200) + '...');
            return;
        } catch (e) {
            console.log(`Falló ${source}: ${e.message}`);
        }
    }
}

checkSources();
