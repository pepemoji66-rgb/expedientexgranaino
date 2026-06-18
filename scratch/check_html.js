const axios = require('axios');

async function checkLecturas() {
    try {
        const res = await axios.get('https://www.lecturas.com/horoscopo/aries', {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        console.log(res.data.substring(0, 5000));
    } catch (e) {
        console.log("Error: " + e.message);
    }
}

checkLecturas();
