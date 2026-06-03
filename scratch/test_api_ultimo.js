const axios = require('axios');

async function testAPI() {
    try {
        const res = await axios.get('http://localhost:10000/api/expedientes/ultimo');
        console.log("✅ RESPUESTA DE LA API:");
        console.log(JSON.stringify(res.data, null, 2));
    } catch (err) {
        console.error("❌ ERROR AL CONECTAR CON LA API:", err.message);
    }
}

testAPI();
