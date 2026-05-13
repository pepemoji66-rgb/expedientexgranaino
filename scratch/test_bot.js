const axios = require('axios');
const token = '8637045537:AAHf8VTr4CCgyqqXTf3V9oR0v64otAmG2SA';

async function testBot() {
    try {
        const res = await axios.get(`https://api.telegram.org/bot${token}/getMe`);
        console.log('✅ BOT DETECTADO:', res.data.result.username);
        
        const updates = await axios.get(`https://api.telegram.org/bot${token}/getUpdates`);
        console.log('📡 UPDATES:', JSON.stringify(updates.data, null, 2));
    } catch (err) {
        console.log('❌ FALLO:', err.response ? err.response.data : err.message);
    }
}

testBot();
