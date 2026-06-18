const axios = require('axios');

async function testXor() {
    try {
        console.log("Probando api.xor.cl...");
        const res = await axios.get('https://api.xor.cl/tyaas/', {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
            timeout: 10000
        });
        console.log("Éxito!");
        console.log(JSON.stringify(res.data, null, 2));
    } catch (e) {
        console.log("Falló: " + e.message);
    }
}

testXor();
