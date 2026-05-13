const axios = require('axios');
const API_BASE_URL = "http://localhost:10000";

async function testAudios() {
    try {
        const res = await axios.get(`${API_BASE_URL}/api/audios`);
        console.log("Respuesta de /api/audios:", JSON.stringify(res.data, null, 2));
    } catch (err) {
        console.error("Error al conectar:", err.message);
    }
}

testAudios();
