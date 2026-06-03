const axios = require('axios');

async function testHoroscopo() {
  try {
    const response = await axios.get('https://api.xor.cl/tyaas/');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error al obtener el horóscopo:', error.message);
  }
}

testHoroscopo();
